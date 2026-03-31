# Supabase Integration Setup Guide - Step by Step

This guide walks you through setting up Supabase for the QuizzicalQuestBuddy application. Follow each step carefully.

## Prerequisites
- A Supabase account (sign up at https://supabase.com)
- A Vercel account for deployment
- Basic knowledge of SQL

---

## Step 1: Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click **"New Project"** 
3. Choose your organization and fill in:
   - **Name**: `quizzical-quest-buddy` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the region closest to your users
   - **Pricing Plan**: Start with `Free` (sufficient for testing)
4. Click **"Create new project"**
5. Wait for the project to initialize (2-3 minutes)

---

## Step 2: Get Your API Keys

1. Once the project is created, go to **Settings > API**
2. You'll see two important keys:
   - **Project URL** (under "API")
   - **Anon Key** (under "API Keys")
3. Copy both of these - you'll need them shortly

**Example:**
```
Project URL: https://abc123def456.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Step 3: Create the Database Schema

1. In Supabase, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase/schema.sql` from your project
4. Paste it into the SQL editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Wait for the query to complete (should see "Success")

**What this creates:**
- `admin_users` table - for admin authentication
- `tests` table - stores all tests/quizzes
- `questions` table - stores questions with options
- `attempts` table - stores all student submissions
- `cheat_violations` table - tracks suspicious activity
- Database indices for performance
- RLS (Row Level Security) policies
- A leaderboard view for rankings

---

## Step 4: Initialize Admin User

1. Go back to **SQL Editor**
2. Click **"New Query"**
3. Copy the contents of `supabase/seed.sql`
4. Paste it into the SQL editor
5. Click **"Run"**

This creates the default admin user:
- **Username:** `alter69x`
- **Password Hash:** Pre-configured (safe for development)

**Note:** In production, change this password immediately using bcrypt.

---

## Step 5: Verify Your Tables

1. Go to **Table Editor** in Supabase
2. You should see these tables:
   - `admin_users`
   - `tests`
   - `questions`
   - `attempts`
   - `cheat_violations`
3. Click each table to verify it was created correctly

---

## Step 6: Set Up Environment Variables (Local Development)

1. In your project root, create a `.env.local` file
2. Add these lines with your actual values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-from-step-2
```

3. Save the file

**Security Note:** Never commit `.env.local` to Git. It's already in `.gitignore`.

---

## Step 7: Install Dependencies

In your project terminal, run:

```bash
npm install
```

This will install Supabase dependencies including `@supabase/supabase-js`.

---

## Step 8: Test Supabase Connection (Optional)

1. Start your dev server: `npm run dev`
2. Open the browser console (F12)
3. You should NOT see any Supabase authentication errors
4. If you see errors, check your environment variables

---

## Step 9: Deploy to Vercel

### Option A: Using Vercel CLI

```bash
npm install -g vercel
vercel
```

### Option B: Using GitHub Integration

1. Push your code to GitHub
2. Go to https://vercel.com
3. Click **"New Project"**
4. Import your GitHub repository
5. Click **"Continue"**
6. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Anon Key
7. Click **"Deploy"**

Your app will be live in 2-3 minutes!

---

## Step 10: Managing Tests via Admin Dashboard

1. Navigate to `yoursite.com/admin`
2. Login with:
   - **Username:** `alter69x`
   - **Password:** `test123`
3. Click **"Create Test"** to add a new quiz
4. Add questions with:
   - Question text
   - 4 options (A, B, C, D)
   - Correct answer index (0, 1, 2, or 3)
   - Explanation text
5. Configure:
   - Time limit (in minutes)
   - Shuffle questions? (Yes/No)
   - Shuffle options? (Yes/No)
6. Click **"Save Test"**

---

## Step 11: Secure Your Admin Panel

**Change Default Credentials:**

For production, you must change the admin password:

1. In Supabase, go to **SQL Editor**
2. Run this query:

```sql
UPDATE admin_users 
SET password_hash = 'your-new-bcrypt-hash' 
WHERE username = 'alter69x';
```

**To generate a bcrypt hash:**

Use an online tool like https://bcrypt-generator.com/ (for testing only!)

Or use Node.js:
```bash
npm install bcrypt
```

```javascript
const bcrypt = require('bcrypt');
const password = 'your-new-password';
const hash = await bcrypt.hash(password, 10);
console.log(hash);
```

---

## Step 12: Enable Row Level Security (Optional but Recommended)

Your schema already has basic RLS enabled. To strengthen it:

1. Go to **Authentication > Policies** in Supabase
2. Review the policies for each table
3. For sensitive data, add additional policies:

```sql
-- Example: Only allow reading public tests
CREATE POLICY "Public tests only" ON tests
FOR SELECT USING (is_active = true);

-- Example: Anyone can submit attempts
CREATE POLICY "Allow submissions" ON attempts
FOR INSERT WITH CHECK (true);
```

---

## Step 13: Monitor and Debug

### View Logs in Supabase

1. Go to **Logs** in Supabase
2. Check for any authentication errors
3. Monitor for cheat violations in `cheat_violations` table

### Check Attempts

1. Go to **Table Editor > attempts**
2. View all submissions
3. See scores, timestamps, device fingerprints, IP addresses

### Access Leaderboard

1. Visit `yoursite.com/test/{test-id}/leaderboard`
2. See top performers for each test

---

## Step 14: Backup Your Data

### Automatic Backups

Supabase provides daily backups on the Pro plan. For Free tier:

1. Go to **Settings > Backups**
2. Click **"Request backup"** (available daily)

### Manual Export

1. Go to **SQL Editor**
2. Run: `SELECT * FROM tests;` then export as CSV
3. Repeat for `attempts`, `questions`, etc.

---

## Troubleshooting

### "Missing Supabase environment variables"

**Solution:** Check that `.env.local` exists and has the correct values

### Supabase connection errors in browser console

**Solution:** 
1. Verify `VITE_` prefix is correct
2. Check URL and key are not truncated
3. Restart dev server after changing `.env`

### Tests not showing up

**Solution:**
1. Check `tests` table in Supabase has data
2. Verify `is_active = true`
3. Check test `slug` matches the URL

### Can't submit attempts

**Solution:**
1. Check user is logged in (has `quizlab_user` in sessionStorage)
2. Verify `attempts` table exists with correct schema
3. Check browser console for specific error messages

### Leaderboard page is empty

**Solution:**
1. Verify attempts have been submitted
2. Check `leaderboard_view` exists in Supabase
3. Ensure `submitted_at` is not null in attempts

---

## Advanced Features

### Add Custom Branding

1. In Supabase, update the `tests` table to add columns:
   - `brand_color` (e.g., "#FF5733")
   - `logo_url` 
   - `description`

2. Use these in the frontend for customization

### Enable Email Notifications

```sql
-- Add email column to admin_users
ALTER TABLE admin_users ADD COLUMN email TEXT;

-- Enable email on new attempts
CREATE TRIGGER notify_admin_on_attempt
AFTER INSERT ON attempts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_function();
```

### Track Time Per Question

Add to `attempts` table:
```sql
ALTER TABLE attempts ADD COLUMN time_per_question INTEGER[];
```

---

## Production Checklist

Before going live:

- [ ] Change admin password
- [ ] Enable RLS on all tables
- [ ] Set up database backups
- [ ] Configure Vercel environment variables
- [ ] Test on mobile devices
- [ ] Test in incognito/private mode
- [ ] Verify all anti-cheat measures
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Enable CORS if needed
- [ ] Review security policies

---

## Support & Resources

- **Supabase Docs:** https://supabase.com/docs
- **SQL Reference:** https://supabase.com/docs/guides/database
- **Auth Guide:** https://supabase.com/docs/guides/auth
- **Vercel Docs:** https://vercel.com/docs

---

## Next Steps

1. ✅ You've set up the database
2. ✅ Environment variables are configured
3. ✅ Deploy to Vercel
4. **Start creating tests** in the admin dashboard
5. **Share test links** with students
6. **Monitor results** in the leaderboard and admin panel

Good luck with QuizzicalQuestBuddy! 🚀
