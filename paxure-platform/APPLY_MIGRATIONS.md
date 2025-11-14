# How to Apply Supabase Migrations

## Method 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/xorziikvgsgirkyasedm
2. Navigate to **SQL Editor** (left sidebar)
3. Click **"New query"**
4. Open the file: `supabase/apply-all-migrations.sql`
5. Copy and paste the **entire contents** into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter) to execute

### Before Running Storage Policies:
Make sure you've created the `docs` storage bucket:
- Go to **Storage** → **New Bucket**
- Name: `docs`
- Set it to **Private** (not public)
- Click **Create bucket**

Then run the SQL file which includes the storage policies.

## Method 2: Via CLI (if network allows)

If your network/firewall allows connections to Supabase:

```powershell
cd "C:\Users\siemonb\OneDrive - ZKW vzw\Paxure\Paxure\Templates\Cursorbestanden\paxure-platform"
npx supabase link --project-ref xorziikvgsgirkyasedm --password "Ecommerce1?Paxure"
npx supabase db push
```

## Project Information
- **Project URL**: https://xorziikvgsgirkyasedm.supabase.co
- **Project Ref**: xorziikvgsgirkyasedm
- **Database Password**: Ecommerce1?Paxure

