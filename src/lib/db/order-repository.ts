import { getDbPool } from '@/lib/db';
import { ensureCoreTables } from '@/lib/db/init-schema';
import { Order, MangwaleLogisticsInfo } from '@/types';

function rowToOrder(row: any, deliveryRow?: any): Order {
  const customer = {
    name: row.customer_name || 'Valued Customer',
    phone: row.customer_phone || '',
    email: row.customer_email || undefined,
    address: row.delivery_address || '',
    area: row.delivery_area || '',
    pincode: row.delivery_pincode || '422005',
    specialInstructions: row.delivery_instructions || undefined,
    coordinates:
      row.delivery_lat && row.delivery_lng
        ? { lat: Number(row.delivery_lat), lng: Number(row.delivery_lng) }
        : undefined,
  };

  let items = [];
  try {
    items = typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [];
  } catch {
    items = [];
  }

  const mangwale: MangwaleLogisticsInfo = deliveryRow
    ? {
        taskId: deliveryRow.task_id,
        status: deliveryRow.status || 'PENDING',
        riderName: deliveryRow.rider_name,
        riderPhone: deliveryRow.rider_phone,
        riderVehicleNo: deliveryRow.rider_vehicle_no,
        trackingUrl: deliveryRow.tracking_url,
        estimatedDeliveryMinutes: deliveryRow.estimated_delivery_minutes,
        dispatchedAt: deliveryRow.dispatched_at ? new Date(deliveryRow.dispatched_at).toISOString() : undefined,
        deliveredAt: deliveryRow.delivered_at ? new Date(deliveryRow.delivered_at).toISOString() : undefined,
        notes: deliveryRow.notes,
      }
    : {
        status: 'PENDING',
        notes: 'Pending dispatch',
      };

  return {
    id: row.id,
    orderNumber: row.order_number,
    outletSlug: row.outlet_slug,
    campaignSlug: row.campaign_slug || 'direct',
    customer,
    items,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount || 0),
    deliveryFee: Number(row.delivery_fee || 0),
    total: Number(row.total),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    orderStatus: row.order_status,
    razorpayOrderId: row.razorpay_order_id || undefined,
    razorpayPaymentId: row.razorpay_payment_id || undefined,
    razorpaySignature: row.razorpay_signature || undefined,
    mangwale,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
  };
}

export const orderRepository = {
  /**
   * Persists an order to PostgreSQL with atomic delivery & customer creation
   */
  saveOrder: async (order: Order): Promise<Order> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return order;
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // 1. Insert or update order
        const orderSql = `
          INSERT INTO public.orders (
            id, order_number, outlet_slug, campaign_slug,
            customer_name, customer_phone, customer_email,
            delivery_address, delivery_area, delivery_pincode, delivery_instructions,
            delivery_lat, delivery_lng,
            items, subtotal, discount, delivery_fee, total,
            payment_method, payment_status, order_status,
            razorpay_order_id, razorpay_payment_id, razorpay_signature,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6, $7,
            $8, $9, $10, $11,
            $12, $13,
            $14, $15, $16, $17, $18,
            $19, $20, $21,
            $22, $23, $24,
            NOW(), NOW()
          )
          ON CONFLICT (id) DO UPDATE SET
            payment_status = EXCLUDED.payment_status,
            order_status = EXCLUDED.order_status,
            razorpay_order_id = COALESCE(EXCLUDED.razorpay_order_id, public.orders.razorpay_order_id),
            razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, public.orders.razorpay_payment_id),
            razorpay_signature = COALESCE(EXCLUDED.razorpay_signature, public.orders.razorpay_signature),
            updated_at = NOW()
          RETURNING *;
        `;

        const values = [
          order.id,
          order.orderNumber,
          order.outletSlug,
          order.campaignSlug || 'direct',
          order.customer.name,
          order.customer.phone,
          order.customer.email || null,
          order.customer.address,
          order.customer.area,
          order.customer.pincode,
          order.customer.specialInstructions || null,
          order.customer.coordinates?.lat || null,
          order.customer.coordinates?.lng || null,
          JSON.stringify(order.items),
          order.subtotal,
          order.discount || 0,
          order.deliveryFee || 0,
          order.total,
          order.paymentMethod,
          order.paymentStatus,
          order.orderStatus,
          order.razorpayOrderId || null,
          order.razorpayPaymentId || null,
          order.razorpaySignature || null,
        ];

        const res = await client.query(orderSql, values);
        const savedRow = res.rows[0];

        // 2. Insert or update Mangwale delivery if present
        if (order.mangwale && order.mangwale.taskId) {
          const deliverySql = `
            INSERT INTO public.deliveries (
              order_id, task_id, provider, status,
              rider_name, rider_phone, rider_vehicle_no,
              tracking_url, estimated_delivery_minutes,
              drop_address, drop_lat, drop_lng,
              dispatched_at, notes, created_at, updated_at
            ) VALUES (
              $1, $2, 'mangwale', $3,
              $4, $5, $6,
              $7, $8,
              $9, $10, $11,
              NOW(), $12, NOW(), NOW()
            )
            ON CONFLICT (id) DO NOTHING;
          `;
          await client.query(deliverySql, [
            order.id,
            order.mangwale.taskId,
            order.mangwale.status,
            order.mangwale.riderName || null,
            order.mangwale.riderPhone || null,
            order.mangwale.riderVehicleNo || null,
            order.mangwale.trackingUrl || null,
            order.mangwale.estimatedDeliveryMinutes || 25,
            order.customer.address,
            order.customer.coordinates?.lat || null,
            order.customer.coordinates?.lng || null,
            order.mangwale.notes || null,
          ]);
        }

        // 3. Upsert Customer record
        const custSql = `
          INSERT INTO public.customers (phone, name, email, saved_addresses, total_orders, total_spent, created_at, updated_at)
          VALUES ($1, $2, $3, $4, 1, $5, NOW(), NOW())
          ON CONFLICT (phone) DO UPDATE SET
            name = EXCLUDED.name,
            total_orders = public.customers.total_orders + 1,
            total_spent = public.customers.total_spent + EXCLUDED.total_spent,
            updated_at = NOW();
        `;
        const addressObj = {
          address: order.customer.address,
          area: order.customer.area,
          pincode: order.customer.pincode,
          coordinates: order.customer.coordinates,
        };
        await client.query(custSql, [
          order.customer.phone,
          order.customer.name,
          order.customer.email || null,
          JSON.stringify([addressObj]),
          order.total,
        ]);

        await client.query('COMMIT');
        return rowToOrder(savedRow, order.mangwale ? { task_id: order.mangwale.taskId, ...order.mangwale } : undefined);
      } catch (err: any) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    } catch (err: any) {
      console.warn('[orderRepository.saveOrder DB Warning, falling back to memory]:', err.message);
      return order;
    }
  },

  /**
   * Retrieve order by ID or orderNumber from DB
   */
  getOrderById: async (id: string): Promise<Order | null> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return null;
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      const res = await pool.query(
        `SELECT o.*, d.task_id, d.status as del_status, d.rider_name, d.rider_phone, 
                d.rider_vehicle_no, d.tracking_url, d.estimated_delivery_minutes, 
                d.dispatched_at, d.delivered_at, d.notes as del_notes
         FROM public.orders o
         LEFT JOIN public.deliveries d ON o.id = d.order_id
         WHERE o.id = $1 OR o.order_number = $1 OR o.razorpay_order_id = $1
         LIMIT 1;`,
        [id]
      );

      if (res.rows.length === 0) return null;
      const row = res.rows[0];
      const delivery = row.task_id
        ? {
            task_id: row.task_id,
            status: row.del_status,
            rider_name: row.rider_name,
            rider_phone: row.rider_phone,
            rider_vehicle_no: row.rider_vehicle_no,
            tracking_url: row.tracking_url,
            estimated_delivery_minutes: row.estimated_delivery_minutes,
            dispatched_at: row.dispatched_at,
            delivered_at: row.delivered_at,
            notes: row.del_notes,
          }
        : undefined;

      return rowToOrder(row, delivery);
    } catch (err: any) {
      console.warn('[orderRepository.getOrderById DB Warning]:', err.message);
      return null;
    }
  },

  /**
   * Retrieve all orders for a specific outlet
   */
  getOrdersByOutlet: async (outletSlug: string): Promise<Order[]> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return [];
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      const res = await pool.query(
        `SELECT o.*, d.task_id, d.status as del_status, d.rider_name, d.rider_phone, 
                d.rider_vehicle_no, d.tracking_url, d.estimated_delivery_minutes, 
                d.dispatched_at, d.delivered_at, d.notes as del_notes
         FROM public.orders o
         LEFT JOIN public.deliveries d ON o.id = d.order_id
         WHERE o.outlet_slug = $1
         ORDER BY o.created_at DESC
         LIMIT 100;`,
        [outletSlug]
      );

      return res.rows.map((row) => {
        const delivery = row.task_id
          ? {
              task_id: row.task_id,
              status: row.del_status,
              rider_name: row.rider_name,
              rider_phone: row.rider_phone,
              rider_vehicle_no: row.rider_vehicle_no,
              tracking_url: row.tracking_url,
              estimated_delivery_minutes: row.estimated_delivery_minutes,
              dispatched_at: row.dispatched_at,
              delivered_at: row.delivered_at,
              notes: row.del_notes,
            }
          : undefined;
        return rowToOrder(row, delivery);
      });
    } catch (err: any) {
      console.warn('[orderRepository.getOrdersByOutlet DB Warning]:', err.message);
      return [];
    }
  },

  /**
   * Retrieve all orders across outlets
   */
  getAllOrders: async (): Promise<Order[]> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return [];
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      const res = await pool.query(
        `SELECT o.*, d.task_id, d.status as del_status, d.rider_name, d.rider_phone, 
                d.rider_vehicle_no, d.tracking_url, d.estimated_delivery_minutes, 
                d.dispatched_at, d.delivered_at, d.notes as del_notes
         FROM public.orders o
         LEFT JOIN public.deliveries d ON o.id = d.order_id
         ORDER BY o.created_at DESC
         LIMIT 200;`
      );

      return res.rows.map((row) => {
        const delivery = row.task_id
          ? {
              task_id: row.task_id,
              status: row.del_status,
              rider_name: row.rider_name,
              rider_phone: row.rider_phone,
              rider_vehicle_no: row.rider_vehicle_no,
              tracking_url: row.tracking_url,
              estimated_delivery_minutes: row.estimated_delivery_minutes,
              dispatched_at: row.dispatched_at,
              delivered_at: row.delivered_at,
              notes: row.del_notes,
            }
          : undefined;
        return rowToOrder(row, delivery);
      });
    } catch (err: any) {
      console.warn('[orderRepository.getAllOrders DB Warning]:', err.message);
      return [];
    }
  },

  /**
   * Update order status
   */
  updateOrderStatus: async (orderId: string, status: Order['orderStatus']): Promise<Order | null> => {
    if (!process.env.DATABASE_URL?.trim()) {
      return null;
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      const res = await pool.query(
        `UPDATE public.orders
         SET order_status = $2, updated_at = NOW()
         WHERE id = $1 OR order_number = $1
         RETURNING *;`,
        [orderId, status]
      );
      if (res.rows.length === 0) return null;
      return rowToOrder(res.rows[0]);
    } catch (err: any) {
      console.warn('[orderRepository.updateOrderStatus DB Warning]:', err.message);
      return null;
    }
  },

  /**
   * Update payment status by Razorpay Order ID or Order ID
   */
  updatePaymentStatus: async (
    razorpayOrderId: string,
    status: Order['paymentStatus'],
    paymentId?: string
  ): Promise<Order | null> => {
    if (!process.env.DATABASE_URL?.trim()) {
      return null;
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      const res = await pool.query(
        `UPDATE public.orders
         SET payment_status = $2,
             razorpay_payment_id = COALESCE($3, razorpay_payment_id),
             order_status = CASE WHEN $2 = 'COMPLETED' AND order_status = 'AWAITING_PAYMENT' THEN 'RECEIVED' ELSE order_status END,
             updated_at = NOW()
         WHERE razorpay_order_id = $1 OR id = $1 OR order_number = $1
         RETURNING *;`,
        [razorpayOrderId, status, paymentId || null]
      );
      if (res.rows.length === 0) return null;
      return rowToOrder(res.rows[0]);
    } catch (err: any) {
      console.warn('[orderRepository.updatePaymentStatus DB Warning]:', err.message);
      return null;
    }
  },

  /**
   * Update delivery status by Mangwale Task ID or Order ID
   */
  updateMangwaleStatus: async (
    identifier: string,
    update: Partial<Order['mangwale']> & { orderStatus?: Order['orderStatus'] }
  ): Promise<Order | null> => {
    if (!process.env.DATABASE_URL?.trim()) {
      return null;
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      // 1. Update deliveries table
      await pool.query(
        `UPDATE public.deliveries
         SET status = COALESCE($2, status),
             rider_name = COALESCE($3, rider_name),
             rider_phone = COALESCE($4, rider_phone),
             rider_vehicle_no = COALESCE($5, rider_vehicle_no),
             tracking_url = COALESCE($6, tracking_url),
             delivered_at = CASE WHEN $2 = 'DELIVERED' THEN NOW() ELSE delivered_at END,
             notes = COALESCE($7, notes),
             updated_at = NOW()
         WHERE task_id = $1 OR order_id = $1;`,
        [
          identifier,
          update.status || null,
          update.riderName || null,
          update.riderPhone || null,
          update.riderVehicleNo || null,
          update.trackingUrl || null,
          update.notes || null,
        ]
      );

      // 2. Update parent order status if requested
      if (update.orderStatus) {
        await pool.query(
          `UPDATE public.orders o
           SET order_status = $2, updated_at = NOW()
           FROM public.deliveries d
           WHERE (o.id = d.order_id AND d.task_id = $1) OR o.id = $1 OR o.order_number = $1;`,
          [identifier, update.orderStatus]
        );
      }

      return await orderRepository.getOrderById(identifier);
    } catch (err: any) {
      console.warn('[orderRepository.updateMangwaleStatus DB Warning]:', err.message);
      return null;
    }
  },

  /**
   * Record a payment transaction into the payment ledger
   */
  recordPaymentTransaction: async (record: {
    orderId: string;
    gateway?: string;
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    amountPaise: number;
    currency?: string;
    status: string;
    rawPayload?: any;
    idempotencyKey?: string;
  }): Promise<boolean> => {
    if (!process.env.DATABASE_URL?.trim()) {
      return true;
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      await pool.query(
        `INSERT INTO public.payment_records (
          order_id, gateway, razorpay_order_id, razorpay_payment_id,
          razorpay_signature, amount_paise, currency, status,
          idempotency_key, raw_payload, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, NOW(), NOW()
        )
        ON CONFLICT (idempotency_key) DO UPDATE SET
          status = EXCLUDED.status,
          razorpay_payment_id = COALESCE(EXCLUDED.razorpay_payment_id, public.payment_records.razorpay_payment_id),
          updated_at = NOW();`,
        [
          record.orderId,
          record.gateway || 'RAZORPAY',
          record.razorpayOrderId || null,
          record.razorpayPaymentId || null,
          record.razorpaySignature || null,
          record.amountPaise,
          record.currency || 'INR',
          record.status,
          record.idempotencyKey || null,
          record.rawPayload ? JSON.stringify(record.rawPayload) : null,
        ]
      );
      return true;
    } catch (err: any) {
      console.warn('[orderRepository.recordPaymentTransaction DB Warning]:', err.message);
      return false;
    }
  },

  /**
   * Log Meta CAPI & Marketing event into the marketing ledger
   */
  recordMarketingEvent: async (event: {
    orderId?: string;
    eventName: string;
    eventId: string;
    pixelId: string;
    outletSlug?: string;
    campaignSlug?: string;
    value?: number;
    currency?: string;
    userHash?: any;
    capiStatus?: string;
    capiResponse?: any;
  }): Promise<boolean> => {
    if (!process.env.DATABASE_URL?.trim()) {
      return true;
    }
    await ensureCoreTables();
    const pool = getDbPool();

    try {
      await pool.query(
        `INSERT INTO public.marketing_events (
          order_id, event_name, event_id, pixel_id,
          outlet_slug, campaign_slug, value, currency,
          user_hash, capi_status, capi_response, created_at
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6, $7, $8,
          $9, $10, $11, NOW()
        );`,
        [
          event.orderId || null,
          event.eventName,
          event.eventId,
          event.pixelId,
          event.outletSlug || null,
          event.campaignSlug || null,
          event.value || 0,
          event.currency || 'INR',
          event.userHash ? JSON.stringify(event.userHash) : null,
          event.capiStatus || 'PENDING',
          event.capiResponse ? JSON.stringify(event.capiResponse) : null,
        ]
      );
      return true;
    } catch (err: any) {
      console.warn('[orderRepository.recordMarketingEvent DB Warning]:', err.message);
      return false;
    }
  },
};
