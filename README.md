# Supabase Setup Guide

To ensure your admin panel works correctly and securely, follow these steps:

## 1. Run the SQL Setup
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. Click on **SQL Editor** in the left sidebar.
4. Click **New query**.
5. Copy the contents of `supabase_setup.sql` from this project and paste it into the editor.
6. Click **Run**.

This will:
- Create all necessary tables (`products`, `orders`, `profiles`, `settings`, `abandoned_carts`).
- Enable **Row Level Security (RLS)** to protect your data.
- Set up **Policies** so only you (`talhafaiz07@gmail.com`) can access the admin features.
- Create a **Trigger** to automatically create user profiles on signup.

## 2. Create Storage Buckets
1. Go to **Storage** in the left sidebar.
2. Click **New bucket**.
3. Create a bucket named `product-images` and make it **Public**.
4. Create another bucket named `hero-images` and make it **Public**.

## 3. Environment Variables
Ensure your `.env` file has the following:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ADMIN_EMAIL=talhafaiz07@gmail.com
```

## 4. Admin Access
Log in with the email `talhafaiz07@gmail.com`. You will be automatically redirected to the admin panel.
