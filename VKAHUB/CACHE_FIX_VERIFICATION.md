# Cache Invalidation Fix - Verification Guide

## Summary

Fixed pervasive stale data bug where pages would show outdated information after mutations (create/update/delete) until manual browser refresh.

## Root Cause

The application had **multiple systemic issues** causing stale data:

1. **CreateCompetition not using React Query mutations** (`src/pages/Moderator/CreateCompetition.tsx:198`)
   - Used plain axios without cache invalidation
   - New competitions wouldn't appear in lists until manual refresh

2. **Overly aggressive staleTime** (`src/App.tsx:15`)
   - 5-minute staleTime prevented automatic refetches
   - Combined with `refetchOnWindowFocus: false`, no safety net existed

3. **No refetchOnMount for list pages**
   - List pages didn't refetch when revisited within staleTime window

4. **Incomplete invalidation patterns**
   - Some mutations only invalidated specific queries, missing related data
   - Moderator actions didn't invalidate public lists

## Changes Made

### 1. Created Centralized Cache Invalidation Utility
**File:** `src/utils/cacheInvalidation.ts`

Provides consistent cache invalidation across the app:
- `invalidateTeamQueries()` - Invalidates all team-related queries
- `invalidateCompetitionQueries()` - Invalidates all competition-related queries
- `invalidateUserQueries()` - Invalidates user-related queries
- `invalidateTeamCompetitionRelation()` - Invalidates both team and competition data

### 2. Updated QueryClient Configuration
**File:** `src/App.tsx:12-21`

**Before:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});
```

**After:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute (reduced from 5)
      refetchOnWindowFocus: true, // Refetch when user returns to tab
      refetchOnMount: true, // Always refetch on component mount
      refetchOnReconnect: true, // Refetch when reconnecting to network
    },
  },
});
```

### 3. Converted CreateCompetition to Use React Query Mutation
**File:** `src/pages/Moderator/CreateCompetition.tsx`

- Added `useMutation` and `useQueryClient` imports
- Replaced plain async/await with `createCompetitionMutation`
- Added proper cache invalidation in `onSuccess`
- Changed loading state to use `isPending` from mutation

### 4. Updated All Mutation Invalidation Patterns

**Files updated:**
- `src/pages/Teams/EditTeam.tsx` - Uses `invalidateTeamQueries()`
- `src/pages/Teams/CreateTeam.tsx` - Uses `invalidateTeamQueries()`
- `src/pages/Teams/TeamDetail.tsx` - Uses `invalidateTeamQueries()`
- `src/pages/Competitions/CompetitionDetail.tsx` - Uses `invalidateCompetitionQueries()`
- `src/pages/Moderator/ModeratorCompetitions.tsx` - Invalidates both moderator and public lists
- `src/pages/Moderator/ModeratorTeams.tsx` - Invalidates both moderator and public lists

## How to Verify

### Test Case 1: Create Competition Flow
**Expected:** New competition appears immediately in list without refresh

**Steps:**
1. Navigate to `/competitions` - note the list of competitions
2. As moderator, navigate to `/moderator/competitions/create`
3. Fill out the form and create a new competition
4. You'll be redirected to `/moderator/competitions`
5. Navigate to `/competitions` (public list)

**✅ Pass Criteria:**
- New competition appears in the list immediately
- No manual browser refresh needed

**❌ Before Fix:**
- New competition would NOT appear
- Required manual refresh (F5) to see it

---

### Test Case 2: Edit Team Flow
**Expected:** Updated team data appears immediately in all views

**Steps:**
1. Navigate to `/teams` - click on a team to view details
2. Click "Управление командой" (team captain only)
3. Edit team name, description, or direction
4. Click "Сохранить изменения"
5. You'll be redirected to team detail page
6. Navigate back to `/teams`

**✅ Pass Criteria:**
- Updated team name/description visible in list immediately
- Team detail page shows updated data
- No manual refresh needed

**❌ Before Fix:**
- List would show old team name
- Required manual refresh to see changes

---

### Test Case 3: Join Team Flow
**Expected:** Team membership updates immediately

**Steps:**
1. Navigate to `/teams`
2. Click on a team you're not a member of
3. Click "Подать заявку"
4. Confirm the action
5. Navigate back to `/teams`
6. Click on the same team again

**✅ Pass Criteria:**
- Team detail shows your pending join request
- Member count updates if auto-approved
- All changes visible without refresh

---

### Test Case 4: Moderator Delete Team
**Expected:** Deleted team disappears from all lists immediately

**Steps:**
1. Open `/teams` in one browser tab (public view)
2. Open `/moderator/teams` in another tab (moderator view)
3. As moderator, delete a team
4. Switch back to public `/teams` tab

**✅ Pass Criteria:**
- Team disappears from both lists immediately
- No refresh needed in either tab

**❌ Before Fix:**
- Team would remain in public list
- Required refresh to sync

---

### Test Case 5: Register Team for Competition
**Expected:** Registration appears immediately in competition details

**Steps:**
1. Navigate to `/competitions`
2. Click on an upcoming competition
3. Click "Зарегистрировать команду"
4. Select your team and submit
5. Stay on the competition detail page

**✅ Pass Criteria:**
- Your team appears in "Участники" tab immediately
- Registration count updates
- No refresh needed

---

### Test Case 6: Cross-Tab Sync
**Expected:** Changes sync across tabs when window gains focus

**Steps:**
1. Open `/teams` in two browser tabs
2. In tab 1, create a new team
3. Switch to tab 2 (give it focus)

**✅ Pass Criteria:**
- Tab 2 automatically refetches and shows new team
- Happens within 1-2 seconds of gaining focus

---

## Technical Verification Checklist

- [ ] No `window.location.reload()` or hard refresh hacks in the code
- [ ] All mutations use `useMutation` from React Query
- [ ] All mutations have proper `onSuccess` with cache invalidation
- [ ] QueryClient `staleTime` is set to 1 minute (not 5)
- [ ] QueryClient `refetchOnWindowFocus` is `true`
- [ ] QueryClient `refetchOnMount` is `true`
- [ ] No queries explicitly override global refetch settings with `false`
- [ ] Centralized invalidation utility is used consistently

## Performance Considerations

**Q: Won't refetchOnMount cause excessive API calls?**

A: Controlled by several factors:
- `staleTime: 1 minute` - Data is considered fresh for 1 minute, preventing refetch during this window even with `refetchOnMount: true`
- React Query deduplicates concurrent requests
- Background refetches are throttled

**Q: What about network usage?**

A: Better than before:
- Previously: Users manually refreshed entire page (all assets + data)
- Now: Only refetch changed data (JSON responses only)
- `refetchOnWindowFocus` only triggers when user switches tabs, not continuously

## Rollback Plan

If issues arise, revert these commits in this order:

1. Revert `src/App.tsx` - restore old QueryClient config
2. Revert `src/utils/cacheInvalidation.ts` - remove utility
3. Revert mutation files - restore old invalidation patterns

## Next Steps (Optional Improvements)

- [ ] Add optimistic updates for instant UI feedback on mutations
- [ ] Implement React Query DevTools in development for debugging
- [ ] Add E2E tests with Playwright/Cypress to automate verification
- [ ] Consider using `queryClient.setQueryData()` for immediate updates before refetch
- [ ] Add error boundaries for failed refetches

## Support

If you encounter issues:
1. Check browser console for React Query errors
2. Verify network requests in DevTools (should see refetch calls)
3. Check that authentication is working (401 errors prevent refetch)
4. Verify backend is returning updated data (test with curl/Postman)
