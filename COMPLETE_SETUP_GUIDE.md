# QuizLab - Complete Supabase Integration Setup Guide

## CRITICAL FIX: Database-First Architecture

The previous issue where tests weren't visible across browsers/devices has been COMPLETELY FIXED. All tests now save to the Supabase database, not just localStorage.

## What Was Fixed

### Before (Broken):
- Tests saved only to localStorage
- Only visible in the same browser/device
- Lost when cache cleared
- Different users saw different tests
- Admin saw no tests on different devices

### After (Fixed):
- Tests saved to Supabase database
- Visible across ALL browsers and devices
- Persistent and permanent storage
- All users see the same tests
- Admin can login anywhere and see all tests

## How It Works Now

### 1. Test Creation (Admin)
```
Admin creates test in any browser
↓
Test saved to Supabase "tests" table
↓
Questions saved to Supabase "questions" table
↓
Accessible from ANY browser/device/location
```

### 2. Test Taking (Student)
```
Student opens shared link
↓
Test loaded from Supabase database (NOT localStorage)
↓
Attempt/result saved to Supabase "attempts" table
↓
Cached in browser for "already submitted" check
↓
Can view anytime, anywhere
```

### 3. Leaderboard
```
All attempts fetched from Supabase
↓
Ranked and displayed in real-time
↓
Updated live as new attempts come in
```

## Files Modified for Supabase Integration

### 1. Core Service Layer
- `src/lib/supabase-service.ts` - ALL test/question/attempt operations use Supabase
  - `getTests()` - Load all tests from DB
  - `getTestById(id)` - Load specific test from DB
  - `getTestBySlug(slug)` - Load test by slug (for test links)
  - `saveTest(test)` - Save test to DB (Admin)
  - `saveQuestion(testId, question, order)` - Save questions to DB
  - `deleteTest(id)` - Delete test from DB (marks as inactive)
  - `deleteQuestion(id)` - Delete question from DB
  - `getAttemptsByTest(testId)` - Get all attempts for leaderboard
  - `getLeaderboard(testId)` - Get ranked leaderboard

### 2. Admin Pages
- `src/pages/AdminDashboard.tsx` - Uses `getTests()` from Supabase, loads async
- `src/pages/AdminTestEditor.tsx` - Uses `getTestById()` and `saveTest()` to Supabase
- `src/pages/AdminResults.tsx` - Shows name field, displays all attempts from DB

### 3. Student Pages
- `src/pages/TestEntry.tsx` - Loads test from Supabase by slug
- `src/pages/ExamPage.tsx` - Loads test by ID from Supabase, saves attempt
- `src/pages/ResultPage.tsx` - Loads test from Supabase for detailed results
- `src/pages/ViewResult.tsx` - Loads test from Supabase for cached results
- `src/pages/Leaderboard.tsx` - Loads rankings from Supabase

### 4. Database Schema
- `scripts/init_supabase.sql` - Complete schema with name field added

## Step-by-Step Setup

### Step 1: Ensure Supabase is Connected
1. Open Settings (top right)
2. Check "Integrations" section
3. Ensure Supabase shows "Connected"

### Step 2: Run Database Migration
1. The `name` column was already added to the attempts table
2. Database is fully ready to use

### Step 3: Test the Full Flow

#### Create a Test (Admin):
1. Go to http://yourapp.com/admin
2. Login with admin credentials
3. Create a new test
4. Add questions
5. Click "Save Test"
6. ✅ Should see test in dashboard

#### Share Test (Student):
1. Copy test link from admin dashboard
2. Open in DIFFERENT browser or incognito window
3. ✅ Test should load (NOT "Test not found")

#### Take Test:
1. Enter name and Telegram username
2. Click "Start Test"
3. Answer questions
4. Submit

#### View Results:
1. See detailed results page
2. Refresh page - results still there
3. Close browser completely
4. Reopen app and test link
5. ✅ Should see "You already submitted" message

#### Check Leaderboard:
1. From result page, click "Leaderboard"
2. ✅ Should see all users ranked by score

#### Admin View:
1. Logout then close browser
2. Open NEW browser
3. Go to /admin
4. Login
5. ✅ Should see all tests

## Key Technical Changes

### Database Operations (All via Supabase)
```typescript
// Load test from DATABASE (not localStorage)
const test = await getTestById(testId);

// Save test to DATABASE
await saveTest(test);

// Get leaderboard from DATABASE
const leaderboard = await getLeaderboard(testId);
```

### Browser Cache (For Performance)
```typescript
// Results cached for "already submitted" check
localStorage.setItem(`quizlab_result_${slug}`, result);

// But all data originates from database
const test = await getTestBySlug(slug); // FROM DB
```

## Troubleshooting

### Issue: "Test not found" appears
**Solution**: 
- Make sure you created the test in admin panel
- Check that the test slug is correct in the URL
- Verify Supabase connection in Settings

### Issue: Different users see different tests
**Solution**:
- All users should see the same tests from database
- If not, check Supabase connection
- Verify tests were saved (check Supabase dashboard)

### Issue: Leaderboard is empty
**Solution**:
- Make sure attempts were submitted (not just started)
- Check that attempts are in Supabase "attempts" table
- Verify leaderboard query is working

### Issue: Admin doesn't see tests on different device
**Solution**:
- Verify admin login credentials
- Tests should load from database automatically
- Check Supabase connection status

## Admin Credentials
```
Username: admin
Password: admin@123
```

## Performance Notes

- Tests load from Supabase (fast, few ms)
- Results cached in localStorage for repeat access
- Leaderboard uses Supabase directly for real-time updates
- All data is persistent and permanent

## What's NOT Using localStorage for tests anymore

❌ Test creation - NOW uses Supabase
❌ Test loading - NOW uses Supabase
❌ Admin dashboard - NOW loads from Supabase
❌ Admin test editor - NOW saves to Supabase

✅ Browser cache still used for:
- User results (for "already submitted" check)
- Theme preference
- Device fingerprint tracking

## Success Indicators

✅ Can create test in Chrome and open in Firefox
✅ Different users on different devices see same test
✅ Admin can login anywhere and see all tests
✅ Tests persist after browser close
✅ Leaderboard shows all attempts
✅ Results are permanent in database

---

**Status**: All Supabase integration is COMPLETE and TESTED
**Date**: 2026-03-31
**Version**: 2.0 (Database-First Architecture)
