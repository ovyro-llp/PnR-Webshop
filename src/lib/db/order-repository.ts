import { getDbPool } from '@/lib/db';
import { ensureCoreTables } from '@/lib/db/init-schema';
import { Order, MangwaleLogisticsInfo, Outlet, OutletStockItem, MenuItem, Employee, CustomerAccount } from '@/types';
import { getMangwaleTrackingUrl } from '@/lib/logistics/mangwale';

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

  const deliveryTaskId = deliveryRow?.task_id || row.mangwale_task_id;
  const customerPhone = row.customer_phone || customer.phone;
  const resolvedTrackingUrl =
    deliveryRow?.tracking_url ||
    (deliveryTaskId && customerPhone
      ? getMangwaleTrackingUrl(deliveryTaskId, customerPhone)
      : undefined);

  const mangwale: MangwaleLogisticsInfo = deliveryRow
    ? {
        taskId: deliveryRow.task_id,
        status: deliveryRow.status || 'PENDING',
        riderName: deliveryRow.rider_name,
        riderPhone: deliveryRow.rider_phone,
        riderVehicleNo: deliveryRow.rider_vehicle_no,
        trackingUrl: resolvedTrackingUrl,
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
            customer_name = EXCLUDED.customer_name,
            customer_phone = EXCLUDED.customer_phone,
            customer_email = EXCLUDED.customer_email,
            payment_status = EXCLUDED.payment_status,
            order_status = EXCLUDED.order_status,
            items = EXCLUDED.items,
            subtotal = EXCLUDED.subtotal,
            discount = EXCLUDED.discount,
            delivery_fee = EXCLUDED.delivery_fee,
            total = EXCLUDED.total,
            delivery_address = EXCLUDED.delivery_address,
            delivery_area = EXCLUDED.delivery_area,
            delivery_pincode = EXCLUDED.delivery_pincode,
            delivery_instructions = EXCLUDED.delivery_instructions,
            delivery_lat = EXCLUDED.delivery_lat,
            delivery_lng = EXCLUDED.delivery_lng,
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

        // 2. Synchronize normalized items table for relational integrity
        if (order.items && Array.isArray(order.items) && order.items.length > 0) {
          await client.query('DELETE FROM public.order_items WHERE order_id = $1;', [order.id]);
          for (const it of order.items) {
            await client.query(
              `INSERT INTO public.order_items (order_id, item_id, name, quantity, price, created_at)
               VALUES ($1, $2, $3, $4, $5, NOW());`,
              [order.id, it.itemId, it.name, it.quantity, it.price]
            );
          }
        }

        // 3. Upsert Mangwale delivery (strictly 1:1 on order_id to prevent duplicates)
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
            ON CONFLICT (order_id) DO UPDATE SET
              task_id = EXCLUDED.task_id,
              status = EXCLUDED.status,
              rider_name = COALESCE(EXCLUDED.rider_name, public.deliveries.rider_name),
              rider_phone = COALESCE(EXCLUDED.rider_phone, public.deliveries.rider_phone),
              rider_vehicle_no = COALESCE(EXCLUDED.rider_vehicle_no, public.deliveries.rider_vehicle_no),
              tracking_url = COALESCE(EXCLUDED.tracking_url, public.deliveries.tracking_url),
              estimated_delivery_minutes = COALESCE(EXCLUDED.estimated_delivery_minutes, public.deliveries.estimated_delivery_minutes),
              notes = COALESCE(EXCLUDED.notes, public.deliveries.notes),
              delivered_at = CASE WHEN EXCLUDED.status = 'DELIVERED' THEN NOW() ELSE public.deliveries.delivered_at END,
              updated_at = NOW();
          `;
          await client.query(deliverySql, [
            order.id,
            order.mangwale.taskId,
            order.mangwale.status,
            order.mangwale.riderName || null,
            order.mangwale.riderPhone || null,
            order.mangwale.riderVehicleNo || null,
            order.mangwale.trackingUrl ||
              (order.mangwale.taskId && order.customer.phone
                ? getMangwaleTrackingUrl(order.mangwale.taskId, order.customer.phone)
                : null),
            order.mangwale.estimatedDeliveryMinutes || 25,
            order.customer.address,
            order.customer.coordinates?.lat || null,
            order.customer.coordinates?.lng || null,
            order.mangwale.notes || null,
          ]);
        }

        // 4. Upsert Customer directory record without duplicate lifetime metric inflation
        const isNewlyCompleted = order.paymentStatus === 'COMPLETED';
        const cleanCustomerPhone = (order.customer.phone || '').replace(/\D/g, '').slice(-10);
        if (cleanCustomerPhone.length === 10) {
          const custSql = `
            INSERT INTO public.customers (phone, name, email, saved_addresses, total_orders, total_spent, created_at, updated_at)
            VALUES ($1, $2, $3, $4, CASE WHEN $5::boolean THEN 1 ELSE 0 END, CASE WHEN $5::boolean THEN $6 ELSE 0.00 END, NOW(), NOW())
            ON CONFLICT (phone) DO UPDATE SET
              name = COALESCE(EXCLUDED.name, public.customers.name),
              email = COALESCE(EXCLUDED.email, public.customers.email),
              updated_at = NOW();
          `;
          const addressObj = {
            address: order.customer.address,
            area: order.customer.area,
            pincode: order.customer.pincode,
            coordinates: order.customer.coordinates,
          };
          await client.query(custSql, [
            cleanCustomerPhone,
            order.customer.name,
            order.customer.email || null,
            JSON.stringify([addressObj]),
            isNewlyCompleted,
            order.total,
          ]);
        }

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
         WHERE o.id = $1 OR o.order_number = $1 OR o.razorpay_order_id = $1 OR d.task_id = $1
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
         WHERE task_id = $1 OR order_id = $1
            OR order_id IN (SELECT id FROM public.orders WHERE order_number = $1);`,
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
          `UPDATE public.orders
           SET order_status = $2, updated_at = NOW()
           WHERE id IN (SELECT order_id FROM public.deliveries WHERE task_id = $1)
              OR id = $1
              OR order_number = $1;`,
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

  /**
   * Save or update an outlet in PostgreSQL
   */
  saveOutlet: async (outlet: Outlet): Promise<Outlet> => {
    if (!process.env.DATABASE_URL?.trim()) return outlet;
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      await pool.query(
        `INSERT INTO public.outlets (
          id, slug, name, tagline, address, area, city, pincode,
          phone, email, is_open, is_busy, google_maps_url,
          coordinates, mangwale_config, default_meta_pixel_id,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12, $13,
          $14, $15, $16,
          NOW(), NOW()
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          tagline = EXCLUDED.tagline,
          address = EXCLUDED.address,
          area = EXCLUDED.area,
          phone = EXCLUDED.phone,
          email = EXCLUDED.email,
          is_open = EXCLUDED.is_open,
          google_maps_url = EXCLUDED.google_maps_url,
          coordinates = EXCLUDED.coordinates,
          mangwale_config = EXCLUDED.mangwale_config,
          default_meta_pixel_id = EXCLUDED.default_meta_pixel_id,
          updated_at = NOW();`,
        [
          outlet.id,
          outlet.slug,
          outlet.name,
          outlet.tagline || '',
          outlet.address,
          outlet.area,
          outlet.city || 'Nashik',
          outlet.pincode || '422005',
          outlet.phone,
          outlet.email || null,
          outlet.isOpen ?? true,
          false,
          outlet.googleMapsUrl || null,
          outlet.coordinates ? JSON.stringify(outlet.coordinates) : null,
          outlet.mangwaleConfig ? JSON.stringify(outlet.mangwaleConfig) : null,
          outlet.defaultMetaPixelId || null,
        ]
      );
      return outlet;
    } catch (err: any) {
      console.warn('[orderRepository.saveOutlet DB Warning]:', err.message);
      return outlet;
    }
  },

  /**
   * Fetch all outlets from PostgreSQL
   */
  getOutlets: async (): Promise<Outlet[]> => {
    if (!process.env.DATABASE_URL?.trim()) return [];
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      const res = await pool.query('SELECT * FROM public.outlets ORDER BY name ASC;');
      return res.rows.map((r: any) => ({
        id: r.id,
        slug: r.slug,
        name: r.name,
        tagline: r.tagline || 'Fresh artisanal bakes & cakes in Nashik',
        address: r.address,
        area: r.area,
        city: r.city || 'Nashik',
        pincode: r.pincode || '422005',
        phone: r.phone,
        email: r.email || `${r.slug}@puffsnrolls.com`,
        openingHours: r.opening_hours || '8:00 AM - 11:00 PM',
        rating: 4.8,
        reviewCount: 420,
        isOpen: r.is_open ?? true,
        minOrderAmount: 99,
        deliveryTimeEstimate: '20-30 mins',
        googleMapsUrl: r.google_maps_url || undefined,
        coordinates: r.coordinates || { lat: 20.0043996, lng: 73.7579984 },
        mangwaleConfig: r.mangwale_config || undefined,
        defaultMetaPixelId: r.default_meta_pixel_id || undefined,
      }));
    } catch (err: any) {
      console.warn('[orderRepository.getOutlets DB Warning]:', err.message);
      return [];
    }
  },

  /**
   * Save or update stock matrix item in PostgreSQL
   */
  updateOutletStockItem: async (
    outletSlug: string,
    itemId: string,
    updates: { isAvailable?: boolean; stockQuantity?: number; customPrice?: number; updatedBy?: string }
  ): Promise<boolean> => {
    if (!process.env.DATABASE_URL?.trim()) return true;
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      await pool.query(
        `INSERT INTO public.outlet_stock (
          outlet_slug, item_id, is_available, stock_quantity,
          custom_price, updated_by, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW()
        )
        ON CONFLICT (outlet_slug, item_id) DO UPDATE SET
          is_available = COALESCE($3, public.outlet_stock.is_available),
          stock_quantity = COALESCE($4, public.outlet_stock.stock_quantity),
          custom_price = COALESCE($5, public.outlet_stock.custom_price),
          updated_by = COALESCE($6, public.outlet_stock.updated_by),
          updated_at = NOW();`,
        [
          outletSlug,
          itemId,
          updates.isAvailable ?? null,
          updates.stockQuantity ?? null,
          updates.customPrice ?? null,
          updates.updatedBy || null,
        ]
      );
      return true;
    } catch (err: any) {
      console.warn('[orderRepository.updateOutletStockItem DB Warning]:', err.message);
      return false;
    }
  },

  /**
   * Fetch outlet stock matrix from PostgreSQL
   */
  getOutletStock: async (
    outletSlug: string
  ): Promise<Array<{ itemId: string; isAvailable: boolean; stockQuantity: number; customPrice?: number }>> => {
    if (!process.env.DATABASE_URL?.trim()) return [];
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      const res = await pool.query(
        'SELECT item_id, is_available, stock_quantity, custom_price FROM public.outlet_stock WHERE outlet_slug = $1;',
        [outletSlug]
      );
      return res.rows.map((r: any) => ({
        itemId: r.item_id,
        isAvailable: r.is_available,
        stockQuantity: r.stock_quantity,
        customPrice: r.custom_price ? Number(r.custom_price) : undefined,
      }));
    } catch (err: any) {
      console.warn('[orderRepository.getOutletStock DB Warning]:', err.message);
      return [];
    }
  },

  /**
   * Fetch system setting by key from PostgreSQL
   */
  getSystemSetting: async <T>(key: string): Promise<T | null> => {
    if (!process.env.DATABASE_URL?.trim()) return null;
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      const res = await pool.query(
        'SELECT value FROM public.system_settings WHERE key = $1 LIMIT 1;',
        [key]
      );
      if (res.rows.length === 0) return null;
      return res.rows[0].value as T;
    } catch (err: any) {
      console.warn(`[orderRepository.getSystemSetting DB Warning for "${key}"]:`, err.message);
      return null;
    }
  },

  /**
   * Upsert system setting by key into PostgreSQL
   */
  saveSystemSetting: async <T>(key: string, value: T): Promise<boolean> => {
    if (!process.env.DATABASE_URL?.trim()) return false;
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      await pool.query(
        `INSERT INTO public.system_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET
           value = EXCLUDED.value,
           updated_at = NOW();`,
        [key, JSON.stringify(value)]
      );
      return true;
    } catch (err: any) {
      console.warn(`[orderRepository.saveSystemSetting DB Warning for "${key}"]:`, err.message);
      return false;
    }
  },

  /**
   * Fetch Master Products catalog from PostgreSQL
   */
  getMasterProducts: async (): Promise<MenuItem[] | null> => {
    return orderRepository.getSystemSetting<MenuItem[]>('master_catalog_products');
  },

  /**
   * Upsert entire Master Products catalog into PostgreSQL
   */
  saveMasterProducts: async (products: MenuItem[]): Promise<boolean> => {
    return orderRepository.saveSystemSetting('master_catalog_products', products);
  },

  /**
   * Fetch Employees roster from PostgreSQL
   */
  getEmployees: async (): Promise<Employee[] | null> => {
    return orderRepository.getSystemSetting<Employee[]>('employees_roster');
  },

  /**
   * Save Employees roster into PostgreSQL
   */
  saveEmployees: async (employees: Employee[]): Promise<boolean> => {
    return orderRepository.saveSystemSetting('employees_roster', employees);
  },

  /**
   * Fetch Marketing Tags from PostgreSQL
   */
  getMarketingTags: async (): Promise<Record<string, unknown> | null> => {
    return orderRepository.getSystemSetting<Record<string, unknown>>('marketing_tags');
  },

  /**
   * Save Marketing Tags into PostgreSQL
   */
  saveMarketingTags: async (tags: Record<string, unknown>): Promise<boolean> => {
    return orderRepository.saveSystemSetting('marketing_tags', tags);
  },

  /**
   * Fetch registered customers from PostgreSQL with optional search
   */
  getCustomers: async (search?: string, limit = 100): Promise<CustomerAccount[]> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return [];
    }
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      let query = `
        SELECT id, phone, name, email, password, saved_addresses, total_orders, total_spent, created_at, updated_at
        FROM public.customers
      `;
      const params: any[] = [];
      if (search && search.trim()) {
        query += ` WHERE phone ILIKE $1 OR name ILIKE $1 OR email ILIKE $1`;
        params.push(`%${search.trim()}%`);
      }
      query += ` ORDER BY updated_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await pool.query(query, params);
      return result.rows.map((row) => ({
        id: row.id,
        phone: row.phone,
        name: row.name,
        email: row.email || undefined,
        password: row.password || 'pnr@customer123',
        savedAddresses: typeof row.saved_addresses === 'string' ? JSON.parse(row.saved_addresses) : row.saved_addresses || [],
        totalOrders: Number(row.total_orders || 0),
        totalSpent: Number(row.total_spent || 0),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      }));
    } catch (err: any) {
      console.error('[orderRepository.getCustomers Error]:', err.message);
      return [];
    }
  },

  /**
   * Fetch a single customer by phone number
   */
  getCustomerByPhone: async (phone: string): Promise<CustomerAccount | null> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return null;
    }
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      const clean = phone.replace(/\D/g, '').slice(-10);
      const result = await pool.query(
        `SELECT id, phone, name, email, password, saved_addresses, total_orders, total_spent, created_at, updated_at
         FROM public.customers WHERE phone = $1 LIMIT 1`,
        [clean]
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0];
      return {
        id: row.id,
        phone: row.phone,
        name: row.name,
        email: row.email || undefined,
        password: row.password || 'pnr@customer123',
        savedAddresses: typeof row.saved_addresses === 'string' ? JSON.parse(row.saved_addresses) : row.saved_addresses || [],
        totalOrders: Number(row.total_orders || 0),
        totalSpent: Number(row.total_spent || 0),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[orderRepository.getCustomerByPhone Error]:', err.message);
      return null;
    }
  },

  /**
   * Update customer password in PostgreSQL
   */
  updateCustomerPassword: async (phone: string, newPassword: string): Promise<boolean> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return false;
    }
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      const clean = phone.replace(/\D/g, '').slice(-10);
      const res = await pool.query(
        `UPDATE public.customers SET password = $1, updated_at = NOW() WHERE phone = $2`,
        [newPassword, clean]
      );
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      console.error('[orderRepository.updateCustomerPassword Error]:', err.message);
      return false;
    }
  },

  /**
   * Upsert customer record with credentials
   */
  createOrUpdateCustomer: async (data: {
    phone: string;
    name: string;
    email?: string;
    password?: string;
    savedAddresses?: any[];
  }): Promise<CustomerAccount | null> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return null;
    }
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      const clean = data.phone.replace(/\D/g, '').slice(-10);
      const res = await pool.query(
        `INSERT INTO public.customers (phone, name, email, password, saved_addresses, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT (phone) DO UPDATE SET
           name = EXCLUDED.name,
           email = COALESCE(EXCLUDED.email, public.customers.email),
           password = COALESCE(EXCLUDED.password, public.customers.password),
           saved_addresses = COALESCE(EXCLUDED.saved_addresses, public.customers.saved_addresses),
           updated_at = NOW()
         RETURNING *;`,
        [
          clean,
          data.name,
          data.email || null,
          data.password || 'pnr@customer123',
          JSON.stringify(data.savedAddresses || []),
        ]
      );
      const row = res.rows[0];
      return {
        id: row.id,
        phone: row.phone,
        name: row.name,
        email: row.email || undefined,
        password: row.password || 'pnr@customer123',
        savedAddresses: typeof row.saved_addresses === 'string' ? JSON.parse(row.saved_addresses) : row.saved_addresses || [],
        totalOrders: Number(row.total_orders || 0),
        totalSpent: Number(row.total_spent || 0),
        createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
        updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      };
    } catch (err: any) {
      console.error('[orderRepository.createOrUpdateCustomer Error]:', err.message);
      return null;
    }
  },

  /**
   * Delete customer from PostgreSQL
   */
  deleteCustomer: async (phone: string): Promise<boolean> => {
    if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.trim()) {
      return false;
    }
    await ensureCoreTables();
    const pool = getDbPool();
    try {
      const clean = phone.replace(/\D/g, '').slice(-10);
      const res = await pool.query(`DELETE FROM public.customers WHERE phone = $1`, [clean]);
      return (res.rowCount ?? 0) > 0;
    } catch (err: any) {
      console.error('[orderRepository.deleteCustomer Error]:', err.message);
      return false;
    }
  },
};
