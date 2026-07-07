-- ==========================================
-- SBB TECH STORE: SUPABASE DATABASE SCHEMA
-- Copy and paste this script directly into the
-- Supabase SQL Editor to set up your tables!
-- ==========================================

-- 1. Create the Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY, -- standard string ID to match app logic
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    category TEXT NOT NULL,
    "imageURL" TEXT,
    "stockCount" INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) on Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create Policies for Products
CREATE POLICY "Allow public read access to products" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow all actions for admin users on products" ON public.products
    FOR ALL USING (true); -- Set up simplified policies for easy testing; you can restrict this later


-- 2. Create the Profiles/Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
    uid TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    "displayName" TEXT,
    "cartItems" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "orderHistory" JSONB DEFAULT '[]'::jsonb NOT NULL,
    "isAdmin" BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for Profiles
CREATE POLICY "Allow users to read their own profile" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update/insert their own profile" ON public.profiles
    FOR ALL USING (true);


-- 3. Create the Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    "orderId" TEXT PRIMARY KEY, -- matches app generated IDs
    "userId" TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    "totalAmount" NUMERIC NOT NULL,
    status TEXT DEFAULT 'Pending'::text NOT NULL,
    "shippingAddress" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on Orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create Policies for Orders
CREATE POLICY "Allow select on orders" ON public.orders
    FOR SELECT USING (true);

CREATE POLICY "Allow insert on orders" ON public.orders
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all on orders" ON public.orders
    FOR ALL USING (true);
