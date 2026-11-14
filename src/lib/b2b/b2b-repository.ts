import { getDbPool } from '@/lib/db';
import { ensureCoreTables } from '@/lib/db/init-schema';
import {
  B2BClient,
  B2BDepartment,
  B2BClientCatalogItem,
  B2BClientUser,
  B2BOrder,
  B2BOrderItem,
  B2BKitchenAggregateItem,
  B2BDepartmentPackingSlip,
} from '@/types';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password.trim()).digest('hex');
}

// =========================================================================
// In-Memory Fallback Store (Used when DATABASE_URL is not configured or offline)
// =========================================================================

interface B2BMemoryStore {
  clients: B2BClient[];
  departments: B2BDepartment[];
  catalogs: B2BClientCatalogItem[];
  users: (B2BClientUser & { passwordHash: string })[];
  orders: B2BOrder[];
}

declare global {
  // eslint-disable-next-line no-var
  var __PNR_B2B_MEMORY_STORE__: B2BMemoryStore | undefined;
}

function getMemoryStore(): B2BMemoryStore {
  if (!globalThis.__PNR_B2B_MEMORY_STORE__) {
    const tcsId = 'c1111111-1111-4111-a111-111111111111';
    const boschId = 'c2222222-2222-4222-a222-222222222222';

    const tcsDept1 = 'd1111111-1111-4111-a111-111111111111';
    const tcsDept2 = 'd2222222-2222-4222-a222-222222222222';
    const tcsDept3 = 'd3333333-3333-4333-a333-333333333333';

    const boschDept1 = 'd4444444-4444-4444-a444-444444444444';
    const boschDept2 = 'd5555555-5555-4555-a555-555555555555';

    globalThis.__PNR_B2B_MEMORY_STORE__ = {
      clients: [
        {
          id: tcsId,
          slug: 'tcs',
          name: 'Tata Consultancy Services (TCS)',
          contactPerson: 'Mr. Pranav Kulkarni',
          phone: '+91 98230 11223',
          email: 'admin.nashik@tcs.com',
          billingAddress: 'TCS SEZ Campus, Gangapur Road, Nashik 422013',
          fulfillingOutletSlug: 'cycle-circle',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          departmentCount: 3,
          productCount: 4,
        },
        {
          id: boschId,
          slug: 'bosch',
          name: 'Bosch Chassis Systems India',
          contactPerson: 'Mrs. Smita Deshmukh',
          phone: '+91 94222 55667',
          email: 'procurement.nsk@in.bosch.com',
          billingAddress: 'MIDC Ambad Industrial Area, Nashik 422010',
          fulfillingOutletSlug: 'cycle-circle',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          departmentCount: 2,
          productCount: 4,
        },
      ],
      departments: [
        {
          id: tcsDept1,
          clientId: tcsId,
          name: 'Executive Canteen',
          code: 'EC-01',
          contactPerson: 'Rahul Patil',
          phone: '+91 98221 00111',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: tcsDept2,
          clientId: tcsId,
          name: 'Floor 3 Tech Pantry',
          code: 'F3-P',
          contactPerson: 'Anjali Sharma',
          phone: '+91 98221 00222',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: tcsDept3,
          clientId: tcsId,
          name: 'VIP Boardroom Lounge',
          code: 'VIP-BR',
          contactPerson: 'Amit Joshi',
          phone: '+91 98221 00333',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: boschDept1,
          clientId: boschId,
          name: 'Plant 1 Cafeteria',
          code: 'P1-CAFE',
          contactPerson: 'Ganesh More',
          phone: '+91 98221 00444',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: boschDept2,
          clientId: boschId,
          name: 'R&D Engineering Lounge',
          code: 'RD-02',
          contactPerson: 'Sneha Shinde',
          phone: '+91 98221 00555',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      catalogs: [
        // TCS Custom Catalog & Rates
        {
          id: 'cat-tcs-1',
          clientId: tcsId,
          productId: 'item-paneer-puff',
          productName: 'Paneer Puff',
          category: 'Puffs & Savories',
          unit: 'pcs',
          b2bPrice: 25.0, // TCS gets 25
          isActive: true,
          displayOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-tcs-2',
          clientId: tcsId,
          productId: 'item-veg-burger',
          productName: 'Veg Burger',
          category: 'Puffs & Savories',
          unit: 'pcs',
          b2bPrice: 35.0,
          isActive: true,
          displayOrder: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-tcs-3',
          clientId: tcsId,
          productId: 'item-mawa-cake',
          productName: 'Mawa Cake Slice',
          category: 'Tea-Time Bakes',
          unit: 'pcs',
          b2bPrice: 20.0,
          isActive: true,
          displayOrder: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-tcs-4',
          clientId: tcsId,
          productId: 'item-high-tea-box',
          productName: 'Executive High-Tea Snack Box',
          category: 'Corporate Combos',
          unit: 'box',
          b2bPrice: 95.0,
          isActive: true,
          displayOrder: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },

        // Bosch Custom Catalog & Rates (DIFFERENT PRICING FOR SAME PRODUCTS)
        {
          id: 'cat-bosch-1',
          clientId: boschId,
          productId: 'item-paneer-puff',
          productName: 'Paneer Puff',
          category: 'Puffs & Savories',
          unit: 'pcs',
          b2bPrice: 28.0, // Bosch gets 28!
          isActive: true,
          displayOrder: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-bosch-2',
          clientId: boschId,
          productId: 'item-veg-burger',
          productName: 'Veg Burger',
          category: 'Puffs & Savories',
          unit: 'pcs',
          b2bPrice: 38.0,
          isActive: true,
          displayOrder: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-bosch-3',
          clientId: boschId,
          productId: 'item-choc-pastry',
          productName: 'Dutch Chocolate Pastry',
          category: 'Pastries & Desserts',
          unit: 'pcs',
          b2bPrice: 45.0,
          isActive: true,
          displayOrder: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'cat-bosch-4',
          clientId: boschId,
          productId: 'item-white-bread',
          productName: 'White Sandwich Bread (Large)',
          category: 'Breads & Daily Bakes',
          unit: 'loaf',
          b2bPrice: 42.0,
          isActive: true,
          displayOrder: 4,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      users: [
        {
          id: 'usr-tcs-1',
          clientId: tcsId,
          departmentId: tcsDept1, // Locked to Executive Canteen
          departmentName: 'Executive Canteen',
          name: 'Rahul Patil',
          username: 'tcs_canteen1',
          passwordHash: hashPassword('tcs@123'),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr-tcs-2',
          clientId: tcsId,
          departmentId: tcsDept2, // Locked to Floor 3 Tech Pantry
          departmentName: 'Floor 3 Tech Pantry',
          name: 'Anjali Sharma',
          username: 'tcs_pantry3',
          passwordHash: hashPassword('tcs@123'),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: 'usr-bosch-1',
          clientId: boschId,
          departmentId: boschDept1, // Locked to Plant 1 Cafeteria
          departmentName: 'Plant 1 Cafeteria',
          name: 'Ganesh More',
          username: 'bosch_plant1',
          passwordHash: hashPassword('bosch@123'),
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      orders: [],
    };
  }
  return globalThis.__PNR_B2B_MEMORY_STORE__;
}

// =========================================================================
// B2B Repository Implementation
// =========================================================================

export const b2bRepository = {
  // -----------------------------------------------------------------------
  // 1. Client Management
  // -----------------------------------------------------------------------
  getClients: async (): Promise<B2BClient[]> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(`
          SELECT c.*,
            (SELECT COUNT(*) FROM public.b2b_departments d WHERE d.client_id = c.id) as dept_count,
            (SELECT COUNT(*) FROM public.b2b_client_catalog p WHERE p.client_id = c.id AND p.is_active = true) as prod_count
          FROM public.b2b_clients c
          ORDER BY c.name ASC;
        `);
        return res.rows.map((row: any) => ({
          id: row.id,
          slug: row.slug,
          name: row.name,
          contactPerson: row.contact_person,
          phone: row.phone,
          email: row.email,
          billingAddress: row.billing_address,
          fulfillingOutletSlug: row.fulfilling_outlet_slug || 'cycle-circle',
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          departmentCount: Number(row.dept_count || 0),
          productCount: Number(row.prod_count || 0),
        }));
      } catch (err: any) {
        console.warn('[b2bRepository.getClients DB Warning, falling back to memory]:', err.message);
      }
    }

    const store = getMemoryStore();
    return store.clients.map((c) => ({
      ...c,
      departmentCount: store.departments.filter((d) => d.clientId === c.id).length,
      productCount: store.catalogs.filter((p) => p.clientId === c.id && p.isActive).length,
    }));
  },

  getClientBySlug: async (slug: string): Promise<B2BClient | null> => {
    const cleanSlug = slug.toLowerCase().trim();
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT c.*,
            (SELECT COUNT(*) FROM public.b2b_departments d WHERE d.client_id = c.id) as dept_count,
            (SELECT COUNT(*) FROM public.b2b_client_catalog p WHERE p.client_id = c.id AND p.is_active = true) as prod_count
           FROM public.b2b_clients c 
           WHERE LOWER(c.slug) = $1 LIMIT 1;`,
          [cleanSlug]
        );
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          contactPerson: row.contact_person,
          phone: row.phone,
          email: row.email,
          billingAddress: row.billing_address,
          fulfillingOutletSlug: row.fulfilling_outlet_slug || 'cycle-circle',
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          departmentCount: Number(row.dept_count || 0),
          productCount: Number(row.prod_count || 0),
        };
      } catch (err: any) {
        console.warn('[b2bRepository.getClientBySlug DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    const found = store.clients.find((c) => c.slug.toLowerCase() === cleanSlug);
    if (!found) return null;
    return {
      ...found,
      departmentCount: store.departments.filter((d) => d.clientId === found.id).length,
      productCount: store.catalogs.filter((p) => p.clientId === found.id && p.isActive).length,
    };
  },

  createClient: async (data: {
    slug: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    billingAddress?: string;
    fulfillingOutletSlug?: string;
  }): Promise<B2BClient> => {
    const cleanSlug = data.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').trim();
    const id = crypto.randomUUID();
    const newClient: B2BClient = {
      id,
      slug: cleanSlug,
      name: data.name.trim(),
      contactPerson: data.contactPerson?.trim(),
      phone: data.phone?.trim(),
      email: data.email?.trim(),
      billingAddress: data.billingAddress?.trim(),
      fulfillingOutletSlug: data.fulfillingOutletSlug || 'cycle-circle',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      departmentCount: 0,
      productCount: 0,
    };

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `INSERT INTO public.b2b_clients (
             id, slug, name, contact_person, phone, email, billing_address, fulfilling_outlet_slug, is_active, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, NOW(), NOW())
           RETURNING *;`,
          [
            newClient.id,
            newClient.slug,
            newClient.name,
            newClient.contactPerson || null,
            newClient.phone || null,
            newClient.email || null,
            newClient.billingAddress || null,
            newClient.fulfillingOutletSlug,
          ]
        );
        const row = res.rows[0];
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          contactPerson: row.contact_person,
          phone: row.phone,
          email: row.email,
          billingAddress: row.billing_address,
          fulfillingOutletSlug: row.fulfilling_outlet_slug,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          departmentCount: 0,
          productCount: 0,
        };
      } catch (err: any) {
        console.warn('[b2bRepository.createClient DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    store.clients.push(newClient);
    return newClient;
  },

  updateClient: async (
    id: string,
    data: {
      name?: string;
      slug?: string;
      contactPerson?: string;
      phone?: string;
      email?: string;
      billingAddress?: string;
      fulfillingOutletSlug?: string;
      isActive?: boolean;
    }
  ): Promise<B2BClient | null> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `UPDATE public.b2b_clients SET
             name = COALESCE($1, name),
             slug = COALESCE($2, slug),
             contact_person = COALESCE($3, contact_person),
             phone = COALESCE($4, phone),
             email = COALESCE($5, email),
             billing_address = COALESCE($6, billing_address),
             fulfilling_outlet_slug = COALESCE($7, fulfilling_outlet_slug),
             is_active = COALESCE($8, is_active),
             updated_at = NOW()
           WHERE id = $9
           RETURNING *;`,
          [
            data.name?.trim() || null,
            data.slug ? data.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').trim() : null,
            data.contactPerson !== undefined ? data.contactPerson : null,
            data.phone !== undefined ? data.phone : null,
            data.email !== undefined ? data.email : null,
            data.billingAddress !== undefined ? data.billingAddress : null,
            data.fulfillingOutletSlug || null,
            data.isActive !== undefined ? data.isActive : null,
            id,
          ]
        );
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          id: row.id,
          slug: row.slug,
          name: row.name,
          contactPerson: row.contact_person,
          phone: row.phone,
          email: row.email,
          billingAddress: row.billing_address,
          fulfillingOutletSlug: row.fulfilling_outlet_slug,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch (err: any) {
        console.warn('[b2bRepository.updateClient DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    const client = store.clients.find((c) => c.id === id);
    if (!client) return null;

    if (data.name !== undefined) client.name = data.name.trim();
    if (data.slug !== undefined) client.slug = data.slug.toLowerCase().replace(/[^a-z0-9_-]/g, '-').trim();
    if (data.contactPerson !== undefined) client.contactPerson = data.contactPerson.trim();
    if (data.phone !== undefined) client.phone = data.phone.trim();
    if (data.email !== undefined) client.email = data.email.trim();
    if (data.billingAddress !== undefined) client.billingAddress = data.billingAddress.trim();
    if (data.fulfillingOutletSlug !== undefined) client.fulfillingOutletSlug = data.fulfillingOutletSlug;
    if (data.isActive !== undefined) client.isActive = data.isActive;
    client.updatedAt = new Date().toISOString();

    return client;
  },

  deleteClient: async (clientId: string): Promise<boolean> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          await client.query(`DELETE FROM public.b2b_orders WHERE client_id = $1;`, [clientId]);
          await client.query(`DELETE FROM public.b2b_client_catalog WHERE client_id = $1;`, [clientId]);
          await client.query(`DELETE FROM public.b2b_client_users WHERE client_id = $1;`, [clientId]);
          await client.query(`DELETE FROM public.b2b_departments WHERE client_id = $1;`, [clientId]);
          await client.query(`DELETE FROM public.b2b_clients WHERE id = $1;`, [clientId]);
          await client.query('COMMIT');
          return true;
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      } catch (err: any) {
        console.warn('[b2bRepository.deleteClient DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    store.orders = store.orders.filter((o) => o.clientId !== clientId);
    store.clients = store.clients.filter((c) => c.id !== clientId);
    store.departments = store.departments.filter((d) => d.clientId !== clientId);
    store.catalogs = store.catalogs.filter((p) => p.clientId !== clientId);
    store.users = store.users.filter((u) => u.clientId !== clientId);
    return true;
  },

  // -----------------------------------------------------------------------
  // 2. Department Management (Created & Deleted by Admin)
  // -----------------------------------------------------------------------
  getDepartmentsByClient: async (clientId: string): Promise<B2BDepartment[]> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT * FROM public.b2b_departments WHERE client_id = $1 ORDER BY name ASC;`,
          [clientId]
        );
        return res.rows.map((row: any) => ({
          id: row.id,
          clientId: row.client_id,
          name: row.name,
          code: row.code,
          contactPerson: row.contact_person,
          phone: row.phone,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      } catch (err: any) {
        console.warn('[b2bRepository.getDepartmentsByClient DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    return store.departments.filter((d) => d.clientId === clientId);
  },

  createDepartment: async (data: {
    clientId: string;
    name: string;
    code?: string;
    contactPerson?: string;
    phone?: string;
  }): Promise<B2BDepartment> => {
    const id = crypto.randomUUID();
    const newDept: B2BDepartment = {
      id,
      clientId: data.clientId,
      name: data.name.trim(),
      code: data.code?.trim().toUpperCase(),
      contactPerson: data.contactPerson?.trim(),
      phone: data.phone?.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `INSERT INTO public.b2b_departments (
             id, client_id, name, code, contact_person, phone, is_active, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
           RETURNING *;`,
          [
            newDept.id,
            newDept.clientId,
            newDept.name,
            newDept.code || null,
            newDept.contactPerson || null,
            newDept.phone || null,
          ]
        );
        const row = res.rows[0];
        return {
          id: row.id,
          clientId: row.client_id,
          name: row.name,
          code: row.code,
          contactPerson: row.contact_person,
          phone: row.phone,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch (err: any) {
        console.warn('[b2bRepository.createDepartment DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    store.departments.push(newDept);
    return newDept;
  },

  deleteDepartment: async (departmentId: string): Promise<boolean> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        await pool.query(`DELETE FROM public.b2b_departments WHERE id = $1;`, [departmentId]);
        return true;
      } catch (err: any) {
        console.warn('[b2bRepository.deleteDepartment DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    store.departments = store.departments.filter((d) => d.id !== departmentId);
    return true;
  },

  // -----------------------------------------------------------------------
  // 3. Dynamic Catalog & Contract Pricing (Client-Specific)
  // -----------------------------------------------------------------------
  getClientCatalog: async (clientId: string): Promise<B2BClientCatalogItem[]> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT * FROM public.b2b_client_catalog 
           WHERE client_id = $1 AND is_active = true 
           ORDER BY display_order ASC, product_name ASC;`,
          [clientId]
        );
        return res.rows.map((row: any) => ({
          id: row.id,
          clientId: row.client_id,
          productId: row.product_id,
          productName: row.product_name,
          category: row.category,
          unit: row.unit || 'pcs',
          b2bPrice: Number(row.b2b_price || 0),
          imageUrl: row.image_url,
          isActive: row.is_active,
          displayOrder: row.display_order || 0,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      } catch (err: any) {
        console.warn('[b2bRepository.getClientCatalog DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    return store.catalogs.filter((c) => c.clientId === clientId && c.isActive);
  },

  upsertClientCatalogItem: async (data: {
    clientId: string;
    productId?: string;
    productName: string;
    category?: string;
    unit?: string;
    b2bPrice: number;
    imageUrl?: string;
  }): Promise<B2BClientCatalogItem> => {
    const id = crypto.randomUUID();
    const item: B2BClientCatalogItem = {
      id,
      clientId: data.clientId,
      productId: data.productId,
      productName: data.productName.trim(),
      category: data.category?.trim() || 'General',
      unit: data.unit?.trim() || 'pcs',
      b2bPrice: Math.max(0, Number(data.b2bPrice)),
      imageUrl: data.imageUrl,
      isActive: true,
      displayOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `INSERT INTO public.b2b_client_catalog (
             id, client_id, product_id, product_name, category, unit, b2b_price, image_url, is_active, display_order, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, 0, NOW(), NOW())
           ON CONFLICT (client_id, product_name) DO UPDATE SET
             b2b_price = EXCLUDED.b2b_price,
             category = EXCLUDED.category,
             unit = EXCLUDED.unit,
             is_active = true,
             updated_at = NOW()
           RETURNING *;`,
          [
            item.id,
            item.clientId,
            item.productId || null,
            item.productName,
            item.category,
            item.unit,
            item.b2bPrice,
            item.imageUrl || null,
          ]
        );
        const row = res.rows[0];
        return {
          id: row.id,
          clientId: row.client_id,
          productId: row.product_id,
          productName: row.product_name,
          category: row.category,
          unit: row.unit,
          b2bPrice: Number(row.b2b_price),
          imageUrl: row.image_url,
          isActive: row.is_active,
          displayOrder: row.display_order,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch (err: any) {
        console.warn('[b2bRepository.upsertClientCatalogItem DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    const existingIndex = store.catalogs.findIndex(
      (c) => c.clientId === data.clientId && c.productName.toLowerCase() === data.productName.toLowerCase().trim()
    );
    if (existingIndex >= 0) {
      store.catalogs[existingIndex].b2bPrice = item.b2bPrice;
      store.catalogs[existingIndex].category = item.category;
      store.catalogs[existingIndex].unit = item.unit;
      store.catalogs[existingIndex].isActive = true;
      store.catalogs[existingIndex].updatedAt = new Date().toISOString();
      return store.catalogs[existingIndex];
    } else {
      store.catalogs.push(item);
      return item;
    }
  },

  deleteClientCatalogItem: async (clientId: string, itemId: string): Promise<boolean> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        await pool.query(
          `DELETE FROM public.b2b_client_catalog WHERE client_id = $1 AND id = $2;`,
          [clientId, itemId]
        );
        return true;
      } catch (err: any) {
        console.warn('[b2bRepository.deleteClientCatalogItem DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    store.catalogs = store.catalogs.filter((c) => !(c.clientId === clientId && c.id === itemId));
    return true;
  },

  // -----------------------------------------------------------------------
  // 4. Client Users (Credentials with Pre-Locked Department)
  // -----------------------------------------------------------------------
  getClientUsers: async (clientId: string): Promise<B2BClientUser[]> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT u.*, d.name as department_name 
           FROM public.b2b_client_users u
           JOIN public.b2b_departments d ON u.department_id = d.id
           WHERE u.client_id = $1
           ORDER BY u.name ASC;`,
          [clientId]
        );
        return res.rows.map((row: any) => ({
          id: row.id,
          clientId: row.client_id,
          departmentId: row.department_id,
          departmentName: row.department_name,
          name: row.name,
          username: row.username,
          isActive: row.is_active,
          lastLogin: row.last_login,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      } catch (err: any) {
        console.warn('[b2bRepository.getClientUsers DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    return store.users
      .filter((u) => u.clientId === clientId)
      .map((u) => {
        const dept = store.departments.find((d) => d.id === u.departmentId);
        return {
          id: u.id,
          clientId: u.clientId,
          departmentId: u.departmentId,
          departmentName: dept?.name || 'Assigned Department',
          name: u.name,
          username: u.username,
          isActive: u.isActive,
          lastLogin: u.lastLogin,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        };
      });
  },

  createClientUser: async (data: {
    clientId: string;
    departmentId: string;
    name: string;
    username: string;
    password: string;
  }): Promise<B2BClientUser> => {
    const id = crypto.randomUUID();
    const cleanUsername = data.username.toLowerCase().trim();
    const passwordHash = hashPassword(data.password);

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `INSERT INTO public.b2b_client_users (
             id, client_id, department_id, name, username, password_hash, is_active, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
           RETURNING *;`,
          [id, data.clientId, data.departmentId, data.name.trim(), cleanUsername, passwordHash]
        );
        const row = res.rows[0];
        const deptRes = await pool.query(`SELECT name FROM public.b2b_departments WHERE id = $1;`, [data.departmentId]);
        return {
          id: row.id,
          clientId: row.client_id,
          departmentId: row.department_id,
          departmentName: deptRes.rows[0]?.name || 'Department',
          name: row.name,
          username: row.username,
          isActive: row.is_active,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch (err: any) {
        console.warn('[b2bRepository.createClientUser DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    const dept = store.departments.find((d) => d.id === data.departmentId);
    const newUser = {
      id,
      clientId: data.clientId,
      departmentId: data.departmentId,
      departmentName: dept?.name || 'Department',
      name: data.name.trim(),
      username: cleanUsername,
      passwordHash,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.users.push(newUser);
    return {
      id: newUser.id,
      clientId: newUser.clientId,
      departmentId: newUser.departmentId,
      departmentName: newUser.departmentName,
      name: newUser.name,
      username: newUser.username,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    };
  },

  deleteClientUser: async (userId: string): Promise<boolean> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        await pool.query(`DELETE FROM public.b2b_client_users WHERE id = $1;`, [userId]);
        return true;
      } catch (err: any) {
        console.warn('[b2bRepository.deleteClientUser DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    store.users = store.users.filter((u) => u.id !== userId);
    return true;
  },

  verifyClientLogin: async (
    clientSlug: string,
    username: string,
    password: string
  ): Promise<{ user: B2BClientUser; client: B2BClient; department: B2BDepartment } | null> => {
    const cleanSlug = clientSlug.toLowerCase().trim();
    const cleanUsername = username.toLowerCase().trim();
    const hashed = hashPassword(password);

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `SELECT u.*, 
                  c.id as client_real_id, c.slug as client_slug, c.name as client_name, c.fulfilling_outlet_slug,
                  d.id as dept_real_id, d.name as dept_name, d.code as dept_code
           FROM public.b2b_client_users u
           JOIN public.b2b_clients c ON u.client_id = c.id
           JOIN public.b2b_departments d ON u.department_id = d.id
           WHERE LOWER(c.slug) = $1 AND LOWER(u.username) = $2 AND u.password_hash = $3 AND u.is_active = true AND c.is_active = true
           LIMIT 1;`,
          [cleanSlug, cleanUsername, hashed]
        );

        if (res.rows.length === 0) return null;
        const row = res.rows[0];

        // Update last login
        await pool.query(`UPDATE public.b2b_client_users SET last_login = NOW() WHERE id = $1;`, [row.id]);

        return {
          user: {
            id: row.id,
            clientId: row.client_real_id,
            departmentId: row.dept_real_id,
            departmentName: row.dept_name,
            name: row.name,
            username: row.username,
            isActive: row.is_active,
            lastLogin: new Date().toISOString(),
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
          client: {
            id: row.client_real_id,
            slug: row.client_slug,
            name: row.client_name,
            fulfillingOutletSlug: row.fulfilling_outlet_slug,
            isActive: true,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
          department: {
            id: row.dept_real_id,
            clientId: row.client_real_id,
            name: row.dept_name,
            code: row.dept_code,
            isActive: true,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          },
        };
      } catch (err: any) {
        console.warn('[b2bRepository.verifyClientLogin DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    const client = store.clients.find((c) => c.slug.toLowerCase() === cleanSlug && c.isActive);
    if (!client) return null;

    const user = store.users.find(
      (u) =>
        u.clientId === client.id &&
        u.username.toLowerCase() === cleanUsername &&
        u.passwordHash === hashed &&
        u.isActive
    );
    if (!user) return null;

    const department = store.departments.find((d) => d.id === user.departmentId);
    if (!department) return null;

    user.lastLogin = new Date().toISOString();

    return {
      user: {
        id: user.id,
        clientId: user.clientId,
        departmentId: user.departmentId,
        departmentName: department.name,
        name: user.name,
        username: user.username,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      client,
      department,
    };
  },

  // -----------------------------------------------------------------------
  // 5. Orders & Requisitions
  // -----------------------------------------------------------------------
  createB2BOrder: async (data: {
    clientSlug: string;
    departmentId: string;
    clientUserId?: string;
    deliveryDate: string;
    deliveryTimeSlot?: string;
    items: {
      productId?: string;
      productName: string;
      category?: string;
      unit?: string;
      b2bPrice?: number;
      quantity: number;
    }[];
    notes?: string;
  }): Promise<B2BOrder> => {
    const client = await b2bRepository.getClientBySlug(data.clientSlug);
    if (!client) throw new Error(`Client with slug "${data.clientSlug}" not found`);

    const clientCatalog = await b2bRepository.getClientCatalog(client.id);

    // Compute order items with client contracted B2B prices
    const orderItems: B2BOrderItem[] = data.items
      .filter((i) => i.quantity > 0)
      .map((item) => {
        const catalogItem = clientCatalog.find(
          (c) => c.productName.toLowerCase() === item.productName.toLowerCase().trim()
        );
        const resolvedPrice = catalogItem ? catalogItem.b2bPrice : item.b2bPrice || 0;
        const resolvedCategory = catalogItem?.category || item.category || 'General';
        const resolvedUnit = catalogItem?.unit || item.unit || 'pcs';

        return {
          productId: catalogItem?.productId || item.productId,
          productName: item.productName.trim(),
          category: resolvedCategory,
          unit: resolvedUnit,
          b2bPrice: resolvedPrice,
          quantity: item.quantity,
          subtotal: Number((resolvedPrice * item.quantity).toFixed(2)),
        };
      });

    const totalQuantity = orderItems.reduce((acc, i) => acc + i.quantity, 0);
    const totalAmount = Number(orderItems.reduce((acc, i) => acc + i.subtotal, 0).toFixed(2));
    const totalItems = orderItems.length;

    const orderNumber = `B2B-${client.slug.toUpperCase()}-${data.deliveryDate.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const id = crypto.randomUUID();

    const departments = await b2bRepository.getDepartmentsByClient(client.id);
    const matchedDept = departments.find((d: B2BDepartment) => d.id === data.departmentId);
    const departmentName = matchedDept?.name || 'Corporate Requisitions';

    const newOrder: B2BOrder = {
      id,
      orderNumber,
      clientId: client.id,
      clientName: client.name,
      clientSlug: client.slug,
      departmentId: data.departmentId,
      departmentName,
      clientUserId: data.clientUserId,
      deliveryDate: data.deliveryDate,
      deliveryTimeSlot: data.deliveryTimeSlot || 'Morning (08:30 AM - 10:00 AM)',
      status: 'RECEIVED',
      items: orderItems,
      totalItems,
      totalQuantity,
      totalAmount,
      notes: data.notes?.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `INSERT INTO public.b2b_orders (
             id, order_number, client_id, department_id, client_user_id, delivery_date, delivery_time_slot,
             status, items, total_items, total_quantity, total_amount, notes, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
           RETURNING *;`,
          [
            newOrder.id,
            newOrder.orderNumber,
            newOrder.clientId,
            newOrder.departmentId,
            newOrder.clientUserId || null,
            newOrder.deliveryDate,
            newOrder.deliveryTimeSlot,
            newOrder.status,
            JSON.stringify(newOrder.items),
            newOrder.totalItems,
            newOrder.totalQuantity,
            newOrder.totalAmount,
            newOrder.notes || null,
          ]
        );
        const row = res.rows[0];
        return {
          id: row.id,
          orderNumber: row.order_number,
          clientId: row.client_id,
          clientName: client.name,
          clientSlug: client.slug,
          departmentId: row.department_id,
          clientUserId: row.client_user_id,
          deliveryDate: row.delivery_date,
          deliveryTimeSlot: row.delivery_time_slot,
          status: row.status,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
          totalItems: Number(row.total_items),
          totalQuantity: Number(row.total_quantity),
          totalAmount: Number(row.total_amount),
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch (err: any) {
        console.warn('[b2bRepository.createB2BOrder DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    store.orders.unshift(newOrder);
    return newOrder;
  },

  getB2BOrders: async (filters?: {
    date?: string;
    clientId?: string;
    departmentId?: string;
    status?: string;
  }): Promise<B2BOrder[]> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const params: any[] = [];
        const whereClauses: string[] = [];

        if (filters?.date && filters.date !== 'ALL') {
          params.push(filters.date);
          whereClauses.push(`o.delivery_date = $${params.length}`);
        }
        if (filters?.clientId && filters.clientId !== 'ALL') {
          params.push(filters.clientId);
          whereClauses.push(`o.client_id = $${params.length}`);
        }
        if (filters?.departmentId && filters.departmentId !== 'ALL') {
          params.push(filters.departmentId);
          whereClauses.push(`o.department_id = $${params.length}`);
        }
        if (filters?.status && filters.status !== 'ALL') {
          params.push(filters.status);
          whereClauses.push(`o.status = $${params.length}`);
        }

        const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        const res = await pool.query(
          `SELECT o.*, c.name as client_name, c.slug as client_slug, d.name as department_name, u.name as requisitioner_name
           FROM public.b2b_orders o
           JOIN public.b2b_clients c ON o.client_id = c.id
           JOIN public.b2b_departments d ON o.department_id = d.id
           LEFT JOIN public.b2b_client_users u ON o.client_user_id = u.id
           ${whereSql}
           ORDER BY o.created_at DESC;`,
          params
        );

        return res.rows.map((row: any) => ({
          id: row.id,
          orderNumber: row.order_number,
          clientId: row.client_id,
          clientName: row.client_name,
          clientSlug: row.client_slug,
          departmentId: row.department_id,
          departmentName: row.department_name,
          clientUserId: row.client_user_id,
          requisitionerName: row.requisitioner_name,
          deliveryDate: row.delivery_date,
          deliveryTimeSlot: row.delivery_time_slot,
          status: row.status,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
          totalItems: Number(row.total_items),
          totalQuantity: Number(row.total_quantity),
          totalAmount: Number(row.total_amount),
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }));
      } catch (err: any) {
        console.warn('[b2bRepository.getB2BOrders DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    return store.orders
      .filter((o) => {
        if (filters?.date && filters.date !== 'ALL' && o.deliveryDate !== filters.date) return false;
        if (filters?.clientId && filters.clientId !== 'ALL' && o.clientId !== filters.clientId) return false;
        if (filters?.departmentId && filters.departmentId !== 'ALL' && o.departmentId !== filters.departmentId) return false;
        if (filters?.status && filters.status !== 'ALL' && o.status !== filters.status) return false;
        return true;
      })
      .map((o) => {
        const client = store.clients.find((c) => c.id === o.clientId);
        const dept = store.departments.find((d) => d.id === o.departmentId);
        const user = store.users.find((u) => u.id === o.clientUserId);
        return {
          ...o,
          clientName: o.clientName || client?.name || 'Corporate Client',
          clientSlug: o.clientSlug || client?.slug,
          departmentName: o.departmentName || dept?.name || 'Requisition Department',
          requisitionerName: o.requisitionerName || user?.name || 'Requisition Officer',
        };
      });
  },

  updateOrderStatus: async (orderId: string, status: B2BOrder['status']): Promise<B2BOrder | null> => {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.trim()) {
      try {
        await ensureCoreTables();
        const pool = getDbPool();
        const res = await pool.query(
          `UPDATE public.b2b_orders 
           SET status = $1, updated_at = NOW() 
           WHERE id = $2 
           RETURNING *;`,
          [status, orderId]
        );
        if (res.rows.length === 0) return null;
        const row = res.rows[0];
        return {
          id: row.id,
          orderNumber: row.order_number,
          clientId: row.client_id,
          departmentId: row.department_id,
          clientUserId: row.client_user_id,
          deliveryDate: row.delivery_date,
          deliveryTimeSlot: row.delivery_time_slot,
          status: row.status,
          items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
          totalItems: Number(row.total_items),
          totalQuantity: Number(row.total_quantity),
          totalAmount: Number(row.total_amount),
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
      } catch (err: any) {
        console.warn('[b2bRepository.updateOrderStatus DB Warning]:', err.message);
      }
    }

    const store = getMemoryStore();
    const order = store.orders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = status;
    order.updatedAt = new Date().toISOString();
    return order;
  },

  // -----------------------------------------------------------------------
  // 6. Kitchen Aggregation Engine (Combines Same Products across Departments)
  // -----------------------------------------------------------------------
  getAggregatedKitchenBakeSheet: async (
    deliveryDate: string,
    clientId?: string
  ): Promise<B2BKitchenAggregateItem[]> => {
    const orders = await b2bRepository.getB2BOrders({
      date: deliveryDate === 'ALL' ? undefined : deliveryDate,
      clientId: clientId === 'ALL' ? undefined : clientId,
    });

    const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');

    // Group matching products across departments
    const productMap = new Map<string, B2BKitchenAggregateItem>();

    for (const order of activeOrders) {
      const clientName = order.clientName || 'Client';
      const departmentName = order.departmentName || 'Department';

      for (const item of order.items) {
        const key = item.productName.toLowerCase().trim();
        if (!productMap.has(key)) {
          productMap.set(key, {
            productName: item.productName,
            category: item.category || 'General',
            unit: item.unit || 'pcs',
            totalQuantity: 0,
            departments: [],
          });
        }

        const aggregate = productMap.get(key)!;
        aggregate.totalQuantity += item.quantity;
        aggregate.departments.push({
          clientName,
          departmentName,
          quantity: item.quantity,
          orderNumber: order.orderNumber,
        });
      }
    }

    return Array.from(productMap.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  },

  // -----------------------------------------------------------------------
  // 7. Department Dispatch Packing Slips
  // -----------------------------------------------------------------------
  getDepartmentPackingSlips: async (
    deliveryDate: string,
    clientId?: string
  ): Promise<B2BDepartmentPackingSlip[]> => {
    const orders = await b2bRepository.getB2BOrders({
      date: deliveryDate === 'ALL' ? undefined : deliveryDate,
      clientId: clientId === 'ALL' ? undefined : clientId,
    });

    const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');

    return activeOrders.map((order) => ({
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientName: order.clientName || 'Corporate Client',
      departmentName: order.departmentName || 'Department',
      deliveryDate: order.deliveryDate,
      deliveryTimeSlot: order.deliveryTimeSlot,
      notes: order.notes,
      totalUnits: order.totalQuantity,
      items: order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        unit: i.unit,
        category: i.category,
      })),
    }));
  },

  // -----------------------------------------------------------------------
  // 8. Client Accounts & Billing Summary
  // -----------------------------------------------------------------------
  getBillingSummary: async (
    deliveryDate: string,
    clientId?: string
  ): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalUnits: number;
    clientBreakdown: {
      clientId: string;
      clientName: string;
      totalAmount: number;
      totalUnits: number;
      orderCount: number;
    }[];
  }> => {
    const orders = await b2bRepository.getB2BOrders({
      date: deliveryDate === 'ALL' ? undefined : deliveryDate,
      clientId: clientId === 'ALL' ? undefined : clientId,
    });

    const activeOrders = orders.filter((o) => o.status !== 'CANCELLED');
    const totalRevenue = Number(activeOrders.reduce((sum, o) => sum + o.totalAmount, 0).toFixed(2));
    const totalOrders = activeOrders.length;
    const totalUnits = activeOrders.reduce((sum, o) => sum + o.totalQuantity, 0);

    const breakdownMap = new Map<
      string,
      { clientId: string; clientName: string; totalAmount: number; totalUnits: number; orderCount: number }
    >();

    for (const o of activeOrders) {
      if (!breakdownMap.has(o.clientId)) {
        breakdownMap.set(o.clientId, {
          clientId: o.clientId,
          clientName: o.clientName || 'Client',
          totalAmount: 0,
          totalUnits: 0,
          orderCount: 0,
        });
      }
      const b = breakdownMap.get(o.clientId)!;
      b.totalAmount = Number((b.totalAmount + o.totalAmount).toFixed(2));
      b.totalUnits += o.totalQuantity;
      b.orderCount += 1;
    }

    return {
      totalRevenue,
      totalOrders,
      totalUnits,
      clientBreakdown: Array.from(breakdownMap.values()),
    };
  },
};
