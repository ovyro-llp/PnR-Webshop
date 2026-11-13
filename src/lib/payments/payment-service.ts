import { createRazorpayOrder, verifyRazorpaySignature, verifyWebhookSignature, getRazorpayClient, getRazorpayClientAsync } from './razorpay';
import { orderStore } from '@/lib/store/order-store';
import { orderRepository } from '@/lib/db/order-repository';
import { dispatchToMangwale } from '@/lib/logistics/mangwale';
import { sendMetaCAPI } from '@/lib/tracking/meta-capi';
import { Order, CustomerDetails, CartItem, PaymentMethod } from '@/types';

export interface CreatePaymentOrderInput {
  amount: number; // in INR
  outletSlug: string;
  campaignSlug?: string;
  customer?: CustomerDetails;
  items?: Array<{
    itemId: string;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }>;
  subtotal?: number;
  discount?: number;
  deliveryFee?: number;
  total?: number;
}

export interface VerifyPaymentInput {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  orderPayload?: {
    outletSlug: string;
    campaignSlug?: string;
    customer: CustomerDetails;
    items: Array<{
      itemId: string;
      name: string;
      price: number;
      quantity: number;
      total: number;
    }>;
    subtotal: number;
    discount?: number;
    deliveryFee?: number;
    total: number;
    paymentMethod?: PaymentMethod;
  };
}

export const paymentService = {
  /**
   * 1. Initialize Razorpay order & reserve pending order in DB
   */
  createPaymentOrder: async (input: CreatePaymentOrderInput) => {
    const { amount, outletSlug, campaignSlug, customer, items } = input;

    if (!amount || amount <= 0) {
      throw new Error('Invalid order amount');
    }
    if (!outletSlug) {
      throw new Error('Outlet slug is required');
    }

    const normalizedSlug = orderStore.normalizeOutletSlug(outletSlug);
    const outlet = orderStore.getOutletBySlug(normalizedSlug);
    if (!outlet) {
      throw new Error(`Outlet not found: ${outletSlug}`);
    }
    if (!outlet.isOpen) {
      throw new Error(`Orders are currently paused for ${outlet.name}. Please choose another outlet.`);
    }

    // Generate unique receipt and notes
    const receipt = `rcpt_${normalizedSlug}_${Date.now()}`;
    const notes: Record<string, string> = {
      outletSlug: normalizedSlug,
      campaignSlug: campaignSlug || 'direct',
      customerName: customer?.name || 'Guest',
      customerPhone: customer?.phone || '',
      itemCount: items ? String(items.length) : '1',
      deliveryAddress: customer?.address || '',
      deliveryArea: customer?.area || '',
      deliveryPincode: customer?.pincode || '',
      deliveryLat: customer?.coordinates?.lat ? String(customer.coordinates.lat) : '',
      deliveryLng: customer?.coordinates?.lng ? String(customer.coordinates.lng) : '',
      magicCheckout: 'true',
    };

    // Call Razorpay API
    const rzpOrder = await createRazorpayOrder({
      amount: Number(amount),
      receipt,
      notes,
      outletSlug: normalizedSlug,
    });

    const { keyId, isDemoMode } = await getRazorpayClientAsync();

    // Persist draft order intent in DB with status AWAITING_PAYMENT
    const orderNumber = `PNR-${Math.floor(10000 + Math.random() * 90000)}`;
    const draftOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      outletSlug: normalizedSlug,
      campaignSlug: campaignSlug || 'direct',
      customer: {
        name: customer?.name || 'Valued Customer',
        phone: customer?.phone || 'AWAITING_VERIFICATION',
        email: customer?.email,
        address: customer?.address || 'Nashik Doorstep Location',
        area: customer?.area || outlet.area,
        pincode: customer?.pincode || '422005',
        specialInstructions: customer?.specialInstructions,
        coordinates: customer?.coordinates,
      },
      items: items || [],
      subtotal: Number(input.subtotal || amount),
      discount: Number(input.discount || 0),
      deliveryFee: Number(input.deliveryFee || 0),
      total: Number(input.total || amount),
      paymentMethod: 'UPI',
      paymentStatus: 'PENDING',
      orderStatus: 'AWAITING_PAYMENT',
      mangwale: {
        status: 'PENDING',
        notes: 'Awaiting payment confirmation',
      },
      razorpayOrderId: rzpOrder.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await orderRepository.saveOrder(draftOrder);
      await orderRepository.recordPaymentTransaction({
        orderId: draftOrder.id,
        razorpayOrderId: rzpOrder.id,
        amountPaise: rzpOrder.amount,
        currency: rzpOrder.currency,
        status: 'CREATED',
        idempotencyKey: `init_${rzpOrder.id}`,
      });
    } catch (e: any) {
      console.warn('Draft order persistence warning:', e.message);
    }

    // Keep draft in memory store too
    if (globalThis.__PNR_ORDERS__) {
      globalThis.__PNR_ORDERS__.unshift(draftOrder);
    }

    return {
      order_id: rzpOrder.id,
      orderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      receipt: rzpOrder.receipt,
      keyId,
      key_id: keyId,
      isDemoMode,
      businessName: "Puffs 'n' Rolls Nashik",
      outletName: outlet.name,
      description: `Artisanal Bakery Order • ${outlet.name}`,
      internalOrderId: draftOrder.id,
      orderNumber: draftOrder.orderNumber,
    };
  },

  /**
   * 2. Authoritative Payment Verification & Settlement (Idempotent)
   */
  verifyAndSettlePayment: async (input: VerifyPaymentInput): Promise<Order> => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderPayload } = input;

    // Validate Signature
    const isValid = await verifyRazorpaySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      throw new Error('Payment signature verification failed. Untrusted transaction.');
    }

    // Find existing order by razorpay_order_id
    let existingOrder =
      (await orderRepository.getOrderById(razorpay_order_id)) ||
      (await orderStore.getOrderByIdAsync(razorpay_order_id)) ||
      orderStore.getOrderById(razorpay_order_id);

    // IDEMPOTENCY CHECK: If already COMPLETED and dispatched, return immediately
    if (existingOrder && existingOrder.paymentStatus === 'COMPLETED') {
      console.log(`[PaymentService] Order ${existingOrder.orderNumber} already settled. Returning.`);
      return existingOrder;
    }

    let settledOrder: Order;

    if (existingOrder) {
      // Update existing draft order
      existingOrder.paymentStatus = 'COMPLETED';
      existingOrder.orderStatus = 'RECEIVED';
      existingOrder.razorpayPaymentId = razorpay_payment_id;
      existingOrder.razorpaySignature = razorpay_signature;
      existingOrder.updatedAt = new Date().toISOString();

      if (orderPayload) {
        existingOrder.customer = {
          ...existingOrder.customer,
          ...orderPayload.customer,
          coordinates: orderPayload.customer?.coordinates || existingOrder.customer?.coordinates,
        };
        existingOrder.items = orderPayload.items || existingOrder.items;
        existingOrder.subtotal = orderPayload.subtotal ?? existingOrder.subtotal;
        existingOrder.discount = orderPayload.discount ?? existingOrder.discount;
        existingOrder.deliveryFee = orderPayload.deliveryFee !== undefined ? Number(orderPayload.deliveryFee) : existingOrder.deliveryFee;
        existingOrder.total = orderPayload.total ?? existingOrder.total;
        existingOrder.paymentMethod = orderPayload.paymentMethod || 'UPI';
      }

      settledOrder = existingOrder;
    } else if (orderPayload) {
      // Create new confirmed order if draft wasn't present
      const normalizedSlug = orderStore.normalizeOutletSlug(orderPayload.outletSlug);
      settledOrder = await orderStore.createOrder({
        outletSlug: normalizedSlug,
        campaignSlug: orderPayload.campaignSlug,
        customer: orderPayload.customer,
        items: orderPayload.items,
        subtotal: Number(orderPayload.subtotal),
        discount: Number(orderPayload.discount || 0),
        deliveryFee: Number(orderPayload.deliveryFee || 0),
        total: Number(orderPayload.total),
        paymentMethod: orderPayload.paymentMethod || 'UPI',
        paymentStatus: 'COMPLETED',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      });
    } else {
      throw new Error(`Order not found for Razorpay ID: ${razorpay_order_id}`);
    }

    // Authoritatively query Razorpay Payments API to retrieve verified contact & customer details
    const { instance, isDemoMode } = await getRazorpayClientAsync();
    let verifiedContact = '';
    let verifiedEmail = '';

    if (instance && !isDemoMode && razorpay_payment_id) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const paymentEntity: any = await instance.payments.fetch(razorpay_payment_id);
        if (paymentEntity) {
          if (paymentEntity.contact) {
            verifiedContact = String(paymentEntity.contact).replace(/\D/g, '').slice(-10);
          }
          if (paymentEntity.email && !paymentEntity.email.includes('@puffsnrolls.com')) {
            verifiedEmail = String(paymentEntity.email);
          }
        }
      } catch (fetchErr) {
        console.warn('[PaymentService] Failed to fetch payment entity from Razorpay:', fetchErr);
      }
    }

    if (verifiedContact && verifiedContact.length === 10) {
      settledOrder.customer.phone = verifiedContact;
      if (
        !settledOrder.customer.name ||
        settledOrder.customer.name === 'Valued Customer' ||
        settledOrder.customer.name === 'Guest Customer' ||
        settledOrder.customer.name === 'Guest'
      ) {
        settledOrder.customer.name = `Customer ${verifiedContact.slice(-4)}`;
      }
    } else if (
      !settledOrder.customer.phone ||
      settledOrder.customer.phone === 'AWAITING_VERIFICATION' ||
      settledOrder.customer.phone.replace(/\D/g, '').length < 10
    ) {
      if (orderPayload?.customer?.phone && orderPayload.customer.phone.replace(/\D/g, '').length === 10) {
        settledOrder.customer.phone = orderPayload.customer.phone.replace(/\D/g, '').slice(-10);
      } else {
        settledOrder.customer.phone = '9822012345'; // Safe fallback for demo/test mode
      }
    }

    if (verifiedEmail) {
      settledOrder.customer.email = verifiedEmail;
    }

    // Ensure coordinates from client or map are attached
    if (orderPayload?.customer?.coordinates) {
      settledOrder.customer.coordinates = orderPayload.customer.coordinates;
    }
    if (orderPayload?.customer?.address) {
      settledOrder.customer.address = orderPayload.customer.address;
    }

    // Decrement stock
    settledOrder.items.forEach((item) => {
      orderStore.decrementStock(settledOrder.outletSlug, item.itemId, item.quantity);
    });

    const outlet = orderStore.getOutletBySlug(settledOrder.outletSlug);

    // 1. Dispatch to Mangwale Logistics
    if (outlet) {
      try {
        const mangwaleRes = await dispatchToMangwale(settledOrder, outlet);
        if (mangwaleRes.success) {
          settledOrder.mangwale = {
            taskId: mangwaleRes.taskId,
            status: mangwaleRes.rider ? 'ASSIGNED' : 'PENDING',
            riderName: mangwaleRes.rider?.name,
            riderPhone: mangwaleRes.rider?.phone,
            riderVehicleNo: mangwaleRes.rider?.vehicleNo,
            trackingUrl: mangwaleRes.trackingUrl,
            estimatedDeliveryMinutes: mangwaleRes.estimatedDeliveryMinutes,
            dispatchedAt: new Date().toISOString(),
            notes: mangwaleRes.message,
          };
          settledOrder.orderStatus = 'PREPARING';
        } else {
          settledOrder.mangwale = {
            status: 'PENDING',
            notes: mangwaleRes.message,
          };
          settledOrder.orderStatus = 'PREPARING';
        }
      } catch (err) {
        console.error('Mangwale dispatch error during settlement:', err);
      }
    }

    // 2. Trigger Meta CAPI Server Purchase Event
    if (outlet) {
      try {
        const campaign = orderStore.getCampaign(settledOrder.outletSlug, settledOrder.campaignSlug);
        const tags = orderStore.getMarketingTags();
        const pixelId = campaign?.metaPixelId || outlet.defaultMetaPixelId || (tags.globalMetaPixelId as string) || '';
        const contentIds = settledOrder.items?.map((i) => i.itemId) || [];
        const contents = settledOrder.items?.map((i) => ({
          id: i.itemId,
          quantity: i.quantity,
          item_price: i.price,
        })) || [];

        // Meta standard Purchase event (Server CAPI)
        await sendMetaCAPI({
          eventName: 'Purchase',
          pixelId: pixelId || '',
          outletSlug: settledOrder.outletSlug,
          campaignSlug: settledOrder.campaignSlug,
          value: settledOrder.total,
          orderId: settledOrder.orderNumber,
          contentName: `Order from ${outlet.name}`,
          contentIds,
          contents,
          userData: {
            name: settledOrder.customer.name,
            phone: settledOrder.customer.phone,
            email: settledOrder.customer.email,
          },
        });

        // Store corresponding Sale event in persistent marketing ledger
        const saleRecord = {
          orderId: settledOrder.orderNumber,
          eventName: 'Sale',
          eventId: `sale_${settledOrder.orderNumber}`,
          pixelId: pixelId || '',
          outletSlug: settledOrder.outletSlug,
          campaignSlug: settledOrder.campaignSlug,
          value: settledOrder.total,
          currency: 'INR',
          capiStatus: 'CONFIRMED_PAID',
          capiResponse: {
            paymentId: razorpay_payment_id,
            paymentMethod: settledOrder.paymentMethod,
            itemCount: settledOrder.items?.length || 0,
          },
        };
        orderStore.recordMarketingEvent(saleRecord);
        await orderRepository.recordMarketingEvent(saleRecord);
      } catch (err) {
        console.warn('Meta CAPI trigger error during settlement:', err);
      }
    }

    // 3. Persist settled state to PostgreSQL
    await orderRepository.saveOrder(settledOrder);
    await orderRepository.recordPaymentTransaction({
      orderId: settledOrder.id,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      amountPaise: Math.round(settledOrder.total * 100),
      currency: 'INR',
      status: 'CAPTURED',
      idempotencyKey: `settle_${razorpay_payment_id}`,
    });

    return settledOrder;
  },

  /**
   * 3. Process incoming Razorpay webhooks (Handles payment.captured, payment.failed)
   */
  handlePaymentWebhook: async (rawBody: string, signature: string) => {
    const isValid = await verifyWebhookSignature({ rawBody, signature });
    if (!isValid) {
      throw new Error('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const payload = event.payload;

    console.log(`[PaymentService Webhook] Event received: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const orderEntity = payload.order?.entity;
      const rzpOrderId = paymentEntity?.order_id || orderEntity?.id;
      const rzpPaymentId = paymentEntity?.id;

      if (!rzpOrderId) return { status: 'no_order_id' };

      // Look up existing order
      let order =
        (await orderRepository.getOrderById(rzpOrderId)) ||
        (await orderStore.getOrderByIdAsync(rzpOrderId)) ||
        orderStore.getOrderById(rzpOrderId);

      if (order) {
        // If already completed, nothing to do
        if (order.paymentStatus === 'COMPLETED') {
          return { status: 'already_completed' };
        }

        // Settle order (covers abandoned tab scenario)
        order.paymentStatus = 'COMPLETED';
        order.orderStatus = 'RECEIVED';
        order.razorpayPaymentId = rzpPaymentId;
        order.updatedAt = new Date().toISOString();

        if (paymentEntity?.contact) {
          const verifiedContact = String(paymentEntity.contact).replace(/\D/g, '').slice(-10);
          if (verifiedContact.length === 10) {
            order.customer.phone = verifiedContact;
            if (
              !order.customer.name ||
              order.customer.name === 'Valued Customer' ||
              order.customer.name === 'Guest Customer' ||
              order.customer.name === 'Guest'
            ) {
              order.customer.name = `Customer ${verifiedContact.slice(-4)}`;
            }
          }
        }
        if (paymentEntity?.email && !paymentEntity.email.includes('@puffsnrolls.com')) {
          order.customer.email = String(paymentEntity.email);
        }

        // Decrement outlet stock
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item) => {
            orderStore.decrementStock(order.outletSlug, item.itemId, item.quantity);
          });
        }

        const outlet = orderStore.getOutletBySlug(order.outletSlug);
        if (outlet) {
          try {
            const mangwaleRes = await dispatchToMangwale(order, outlet);
            if (mangwaleRes.success) {
              order.mangwale = {
                taskId: mangwaleRes.taskId,
                status: mangwaleRes.rider ? 'ASSIGNED' : 'PENDING',
                riderName: mangwaleRes.rider?.name,
                riderPhone: mangwaleRes.rider?.phone,
                riderVehicleNo: mangwaleRes.rider?.vehicleNo,
                trackingUrl: mangwaleRes.trackingUrl,
                estimatedDeliveryMinutes: mangwaleRes.estimatedDeliveryMinutes,
                dispatchedAt: new Date().toISOString(),
                notes: mangwaleRes.message,
              };
              order.orderStatus = 'PREPARING';
            } else {
              order.mangwale = {
                status: 'PENDING',
                notes: mangwaleRes.message,
              };
              order.orderStatus = 'PREPARING';
            }
          } catch (mErr) {
            console.error('Mangwale auto-dispatch on webhook error:', mErr);
          }

          try {
            const campaign = orderStore.getCampaign(order.outletSlug, order.campaignSlug);
            const tags = orderStore.getMarketingTags();
            const pixelId = campaign?.metaPixelId || outlet.defaultMetaPixelId || (tags.globalMetaPixelId as string) || '';
            await sendMetaCAPI({
              eventName: 'Purchase',
              pixelId: pixelId || '',
              outletSlug: order.outletSlug,
              campaignSlug: order.campaignSlug,
              value: order.total,
              orderId: order.orderNumber,
              contentName: `Order from ${outlet.name}`,
              contentIds: order.items?.map((i) => i.itemId) || [],
              contents: order.items?.map((i) => ({
                id: i.itemId,
                quantity: i.quantity,
                item_price: i.price,
              })) || [],
              userData: {
                name: order.customer.name,
                phone: order.customer.phone,
                email: order.customer.email,
              },
            });
          } catch (cErr) {
            console.warn('Meta CAPI on webhook error:', cErr);
          }
        }

        await orderRepository.saveOrder(order);
        await orderRepository.recordPaymentTransaction({
          orderId: order.id,
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          amountPaise: Number(paymentEntity?.amount || Math.round(order.total * 100)),
          currency: 'INR',
          status: 'CAPTURED',
          idempotencyKey: `wh_captured_${rzpPaymentId}`,
          rawPayload: payload,
        });

        console.log(`[PaymentService Webhook] Order ${order.orderNumber} settled via webhook.`);
        return { status: 'settled', orderNumber: order.orderNumber };
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const rzpOrderId = paymentEntity?.order_id;
      const rzpPaymentId = paymentEntity?.id;

      if (rzpOrderId) {
        await orderRepository.updatePaymentStatus(rzpOrderId, 'FAILED', rzpPaymentId);
        orderStore.updatePaymentStatus(rzpOrderId, 'FAILED', rzpPaymentId);
        await orderRepository.recordPaymentTransaction({
          orderId: rzpOrderId,
          razorpayOrderId: rzpOrderId,
          razorpayPaymentId: rzpPaymentId,
          amountPaise: Number(paymentEntity?.amount || 0),
          status: 'FAILED',
          idempotencyKey: `wh_failed_${rzpPaymentId}`,
          rawPayload: payload,
        });
      }
    }

    return { status: 'acknowledged', event: eventType };
  },
};
