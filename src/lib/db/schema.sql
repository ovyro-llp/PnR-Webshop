-- =========================================================================
-- Puffs 'n' Rolls (PnR) Core Database Schema
-- Railway PostgreSQL Engine
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id VARCHAR(100) PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    outlet_slug VARCHAR(100) NOT NULL,
    campaign_slug VARCHAR(100) DEFAULT 'direct',
    
    -- Customer Information
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    customer_email VARCHAR(255),
    delivery_address TEXT NOT NULL,
    delivery_area VARCHAR(100) NOT NULL,
    delivery_pincode VARCHAR(20) NOT NULL,
    delivery_instructions TEXT,
    delivery_lat DOUBLE PRECISION,
    delivery_lng DOUBLE PRECISION,
    
    -- Items and Financials
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    
    -- Order & Payment Lifecycle
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI', -- 'UPI', 'CARD', 'COD', 'NETBANKING'
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'COD_CONFIRMED'
    order_status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED', -- 'AWAITING_PAYMENT', 'RECEIVED', 'PREPARING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'
    
    -- Payment Gateways References
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    
    -- Attribution & Marketing Data
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    fbclid VARCHAR(255),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_outlet_slug ON public.orders(outlet_slug);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON public.orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON public.orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_status ON public.orders(order_status);

-- 2. Payment Records Ledger Table (Idempotent Transaction History)
CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) REFERENCES public.orders(id) ON DELETE CASCADE,
    gateway VARCHAR(50) NOT NULL DEFAULT 'RAZORPAY',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    razorpay_signature VARCHAR(255),
    amount_paise BIGINT NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'CREATED', -- 'CREATED', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED'
    idempotency_key VARCHAR(150) UNIQUE,
    raw_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_records_order_id ON public.payment_records(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_rzp_order_id ON public.payment_records(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_rzp_payment_id ON public.payment_records(razorpay_payment_id);

-- 3. Deliveries Table (Mangwale Logistics Dispatch & Tracking)
CREATE TABLE IF NOT EXISTS public.deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    task_id VARCHAR(100) NOT NULL, -- Mangwale order_id e.g. ENT000182 or MNG-NSK-XXXX
    provider VARCHAR(50) NOT NULL DEFAULT 'mangwale',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ASSIGNED', 'ARRIVED_PICKUP', 'PICKED_UP', 'ARRIVED_DROP', 'DELIVERED', 'CANCELLED', 'FAILED'
    rider_name VARCHAR(150),
    rider_phone VARCHAR(50),
    rider_vehicle_no VARCHAR(50),
    tracking_url TEXT,
    estimated_delivery_minutes INTEGER DEFAULT 25,
    pickup_address TEXT,
    pickup_lat DOUBLE PRECISION,
    pickup_lng DOUBLE PRECISION,
    drop_address TEXT,
    drop_lat DOUBLE PRECISION,
    drop_lng DOUBLE PRECISION,
    dispatched_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    raw_events JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_deliveries_order_id UNIQUE (order_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_deliveries_unique_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_task_id ON public.deliveries(task_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);

-- 4. Order Items Table (Relational Item Catalog per Order)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_id ON public.order_items(item_id);

-- 5. Marketing Events Table (Meta CAPI & Pixel Deduplication Ledger)
CREATE TABLE IF NOT EXISTS public.marketing_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(100),
    event_name VARCHAR(100) NOT NULL, -- 'Purchase', 'InitiateCheckout', 'AddToCart', 'PageView'
    event_id VARCHAR(150) NOT NULL, -- Unified deduplication key between browser Pixel and server CAPI
    pixel_id VARCHAR(100) NOT NULL,
    outlet_slug VARCHAR(100),
    campaign_slug VARCHAR(100),
    value NUMERIC(10, 2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'INR',
    user_hash JSONB, -- Hashed phone, email for match quality
    capi_status VARCHAR(50) DEFAULT 'PENDING', -- 'SENT', 'FAILED', 'SIMULATED'
    capi_response JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketing_events_event_id ON public.marketing_events(event_id);
CREATE INDEX IF NOT EXISTS idx_marketing_events_order_id ON public.marketing_events(order_id);

-- 6. Customers Table (Passwordless & Persistent Address Directory)
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    saved_addresses JSONB DEFAULT '[]'::jsonb,
    total_orders INTEGER DEFAULT 0 CHECK (total_orders >= 0),
    total_spent NUMERIC(10, 2) DEFAULT 0.00 CHECK (total_spent >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);

-- 7. Outlets Master Table
CREATE TABLE IF NOT EXISTS public.outlets (
    id VARCHAR(100) PRIMARY KEY,
    slug VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    city VARCHAR(100) DEFAULT 'Nashik',
    pincode VARCHAR(20) DEFAULT '422005',
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    is_open BOOLEAN DEFAULT true,
    is_busy BOOLEAN DEFAULT false,
    google_maps_url TEXT,
    coordinates JSONB,
    mangwale_config JSONB,
    default_meta_pixel_id VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outlets_slug ON public.outlets(slug);

-- 8. Outlet Stock Matrix (Per-outlet availability & quantities)
CREATE TABLE IF NOT EXISTS public.outlet_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outlet_slug VARCHAR(100) NOT NULL,
    item_id VARCHAR(100) NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT true,
    stock_quantity INTEGER DEFAULT -1,
    custom_price NUMERIC(10, 2),
    updated_by VARCHAR(255),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_outlet_stock UNIQUE (outlet_slug, item_id)
);

CREATE INDEX IF NOT EXISTS idx_outlet_stock_outlet_slug ON public.outlet_stock(outlet_slug);
CREATE INDEX IF NOT EXISTS idx_outlet_stock_item_id ON public.outlet_stock(item_id);

-- 9. System & Gateway Settings Table (Permanent configuration unaffected by code deployments)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(100) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
