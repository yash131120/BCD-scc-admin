# Digital Business Card - Database Setup Instructions

## Step 1: Supabase Project Setup

### 1.1 Create New Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub/Google or create account
4. Click "New Project"
5. Choose your organization
6. Fill in project details:
   - **Name**: `digital-business-cards`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
7. Click "Create new project"
8. Wait for project to be ready (2-3 minutes)

### 1.2 Get Project Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **Project API Key** (anon public key)

### 1.3 Update Environment Variables
1. In your project, copy `.env.example` to `.env`
2. Replace the values with your actual Supabase credentials:
```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 2: Database Schema Setup

### 2.1 Run Main Schema Migration
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy the entire content from `supabase/migrations/create_complete_schema.sql`
4. Paste it in the SQL editor
5. Click "Run" (bottom right)
6. Wait for success message

### 2.2 Setup Storage for Images
1. In Supabase dashboard, go to **Storage**
2. You should see an "avatars" bucket created
3. If not, go back to **SQL Editor**
4. Create new query with content from `supabase/migrations/setup_storage.sql`
5. Click "Run"

### 2.3 Verify Setup
1. Go to **Database** → **Tables**
2. You should see these tables:
   - `profiles`
   - `business_cards`
   - `social_links`
   - `card_analytics`
   - `card_templates`

3. Go to **Storage**
4. You should see `avatars` bucket

## Step 3: Authentication Setup

### 3.1 Configure Auth Settings
1. Go to **Authentication** → **Settings**
2. Under **Site URL**, add your domain:
   - For development: `http://localhost:5173`
   - For production: `https://yourdomain.com`
3. Under **Redirect URLs**, add:
   - `http://localhost:5173/**`
   - `https://yourdomain.com/**`

### 3.2 Email Settings (Optional)
1. Go to **Authentication** → **Settings** → **SMTP Settings**
2. Configure your email provider or use Supabase's default
3. Customize email templates if needed

## Step 4: Security Configuration

### 4.1 Row Level Security (RLS)
- RLS is automatically enabled by the migration
- Policies are set up for secure access
- Users can only access their own data

### 4.2 Storage Policies
- Avatar upload policies are configured
- Users can only upload to their own folder
- Public read access for profile images

## Step 5: Test the Setup

### 5.1 Start Development Server
```bash
npm run dev
```

### 5.2 Test User Registration
1. Go to your app
2. Create a new account
3. Check if profile is created in `profiles` table

### 5.3 Test Image Upload
1. Try uploading a profile image
2. Check if image appears in Storage → avatars bucket

## Step 6: Production Deployment

### 6.1 Environment Variables
Make sure to set these in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### 6.2 Domain Configuration
1. Update Site URL in Supabase Auth settings
2. Add production domain to Redirect URLs

## Troubleshooting

### Common Issues:

1. **Migration fails**: 
   - Check if you have the latest Supabase project
   - Ensure you're running the SQL as the project owner

2. **Image upload fails**:
   - Verify storage bucket exists
   - Check storage policies are applied
   - Ensure file size is under 5MB

3. **Authentication issues**:
   - Verify environment variables are correct
   - Check Site URL and Redirect URLs in Auth settings

4. **RLS errors**:
   - Ensure user is authenticated
   - Check if policies are applied correctly

### Getting Help:
- Check Supabase documentation: [supabase.com/docs](https://supabase.com/docs)
- Join Supabase Discord for community support
- Check browser console for detailed error messages

## Database Schema Overview

### Tables Created:
1. **profiles** - User profile information
2. **business_cards** - Main card data with themes/layouts
3. **social_links** - Social media links for cards
4. **card_analytics** - Track card views and interactions
5. **card_templates** - Predefined card templates

### Key Features:
- Automatic profile creation on signup
- Unique slug generation for cards
- Image upload with compression
- Analytics tracking
- Template system for quick card creation
- Comprehensive security with RLS

Your database is now ready for the Digital Business Card application!