# Quick Start Guide - 5 Minutes

## What's New?

Your app now has:
✅ **Supabase Backend** - All data stored in cloud database
✅ **Question Shuffling** - Randomizes question & option order per attempt
✅ **Leaderboard** - Shows top scores for each test
✅ **One Attempt Per Device** - Uses device fingerprinting to prevent cheating
✅ **Advanced Anti-Cheat** - Validates answers, tracks time, blocks suspicious activity
✅ **Black/White Professional Theme** - Sleek, modern design
✅ **Mobile Optimized** - Works perfectly on phones and tablets
✅ **Vercel Ready** - `vercel.json` configured for easy deployment

---

## The Fastest Path to Production

### 1. Create Supabase Project (2 min)

Go to https://supabase.com/dashboard
- Click "New Project"
- Create project with strong password
- Wait for initialization

### 2. Get Your Keys (1 min)

- Settings → API
- Copy: **Project URL** and **Anon Key**

### 3. Run SQL (1 min)

In Supabase SQL Editor:
- Paste contents of `supabase/schema.sql`
- Click "Run"
- Paste contents of `supabase/seed.sql`
- Click "Run"

### 4. Set Environment Variables (1 min)

Create `.env.local` file:
```env
VITE_SUPABASE_URL=your-url-from-step-2
VITE_SUPABASE_ANON_KEY=your-key-from-step-2
```

### 5. Deploy to Vercel (Optional, 5 min)

Push to GitHub, then:
- Go to https://vercel.com
- Import repo
- Add same env vars from step 4
- Deploy!

---

## Start Using It

### Access Admin Panel
```
http://localhost:5173/admin
Username: alter69x
Password: test123
```

### Create a Test
1. Click "Create Test"
2. Add questions with options
3. Mark correct answer
4. Save

### View Leaderboard
```
http://localhost:5173/test/{test-id}/leaderboard
```

### Take a Test (As Student)
1. Share test link with students
2. Students enter username + secret code
3. They take the test
4. See results and can view leaderboard

---

## Key Features Explained

### Question Shuffling
- Questions appear in random order
- Options appear in random order
- Reproducible per attempt (same device = same shuffle)
- Can be disabled per test

### Device Fingerprinting
- Detects device using canvas, WebGL, plugins, screen resolution
- One attempt per device per test
- 24-hour cooldown before retry
- Cheat violations logged

### Anti-Cheat Validation
- Flags answers if completed too fast (< 3 seconds per question)
- Detects suspicious answer patterns
- Tracks tab switches and window focus
- Prevents right-click and keyboard shortcuts
- Auto-submits after 3 violations

### Leaderboard
- Shows top 50 scorers
- Displays score, percentage, submission time
- Ranked by score then submission time
- Updates in real-time

---

## File Structure

New files created:
```
src/lib/
  ├── supabase.ts              ← Supabase client config
  ├── supabase-service.ts      ← Database operations
  ├── anti-cheat.ts            ← Anti-cheat utilities
  ├── shuffle.ts               ← Question shuffling
  ├── attempt-tracking.ts      ← Prevent re-attempts
  └── analytics.ts             ← Advanced metrics

src/pages/
  └── Leaderboard.tsx          ← New leaderboard page

supabase/
  ├── schema.sql               ← Database tables
  └── seed.sql                 ← Initial admin user

vercel.json                     ← Vercel deployment config
.env.example                    ← Environment template
SUPABASE_SETUP_GUIDE.md         ← Detailed setup (14 steps)
QUICK_START.md                  ← This file
```

---

## Important Changes to Existing Code

### Store.ts
- Added `shuffleQuestions` and `shuffleOptions` to Test interface
- Old localStorage methods still work (for backward compatibility)
- You can import `supabase-service.ts` for Supabase operations

### App.tsx
- Added leaderboard route: `/test/:testId/leaderboard`

### Theme (index.css)
- Changed to professional black/white color scheme
- Primary: Pure white (#FFFFFF)
- Background: Pure black (#000000)
- Accent: Light gray

---

## Testing Locally

```bash
# Install dependencies
npm install

# Set up .env.local with Supabase keys

# Start dev server
npm run dev

# Test on mobile
# Get your local IP: ipconfig getifaddr en0  (macOS)
# Visit: http://192.168.x.x:5173 on mobile
```

---

## Environment Variables Reference

You'll need to add to Vercel:
```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc...
```

⚠️ These are public (for Vite frontend) - they're NOT sensitive
The real security comes from Supabase's Row Level Security

---

## API Endpoints (Using Supabase)

All data flows through Supabase now:

```typescript
// Get test by slug
const test = await getTestBySlug('my-test-slug');

// Save attempt
await saveAttempt(attempt, deviceFingerprint);

// Check if user attempted
const hasAttempted = await checkExistingAttempt(testId, fingerprint);

// Get leaderboard
const leaderboard = await getLeaderboard(testId);

// Log cheat violation
await logCheatViolation(attemptId, 'tab_switch');
```

---

## Database Schema Overview

### tests
- id, name, slug, secret_code, time_limit
- shuffle_questions, shuffle_options
- is_active

### questions
- id, test_id, question, options[], correct_answer
- explanation, display_order

### attempts
- id, test_id, telegram_username
- answers[], score, total_questions
- started_at, submitted_at
- device_fingerprint, ip_address, user_agent

### cheat_violations
- id, attempt_id, violation_type
- violation_details, timestamp

---

## Troubleshooting Quick Answers

| Problem | Solution |
|---------|----------|
| "Missing Supabase env" | Check `.env.local` exists with correct values |
| Tests don't show | Verify `is_active = true` in Supabase |
| Can't submit | Check browser console for errors, verify sessionStorage |
| Leaderboard empty | Submit a test attempt first |
| Build fails | Run `npm install` and check for errors |

---

## Next Steps

1. **Follow SUPABASE_SETUP_GUIDE.md** for detailed setup (14 steps)
2. **Change admin password** (currently `test123`)
3. **Create your first test** in admin panel
4. **Test locally** with different devices/browsers
5. **Deploy to Vercel** when ready
6. **Share with students!**

---

## Support

Need help?
- Check SUPABASE_SETUP_GUIDE.md for detailed instructions
- Check browser console (F12) for error messages
- Verify Supabase project settings
- See Vercel logs if deployment fails

---

## Production Checklist

- [ ] Changed admin password
- [ ] Tested on mobile
- [ ] Verified anti-cheat works
- [ ] Set up Vercel environment variables
- [ ] Database backups enabled
- [ ] Reviewed RLS policies
- [ ] Tested leaderboard functionality
- [ ] Checked error logs

Good luck! 🚀
