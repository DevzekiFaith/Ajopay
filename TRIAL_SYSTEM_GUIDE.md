# Trial & Subscription System Guide

## Overview
The AjoPay app now features a **4-day free trial system** for the King Elite plan. After the trial period ends, users must upgrade to a paid subscription (₦1,200 one-time) to continue using the app's features.

## Key Changes

### 1. Wealth Plan Updates
- ❌ **Removed**: Free Foundation Plan
- ✅ **Active**: King Elite Plan with 4-Day FREE Trial
- 💰 **Pricing**: ₦1,200 one-time payment after trial

### 2. Trial System Features

#### Trial Duration
- **Length**: 4 days from sign-up
- **Access**: Full access to all King Elite features during trial
- **Automatic**: Trial starts immediately upon sign-up

#### Trial Restrictions
After the 4-day trial expires:
- ❌ Cannot make contributions
- ❌ Cannot create savings goals
- ❌ Cannot join/create savings circles
- ❌ Cannot access advanced analytics
- ❌ Cannot use gamification features
- ❌ Cannot export data

#### Trial Status Display
- 🔔 **Navigation Bar**: Shows remaining trial time
- ⏰ **Visual Indicators**: Badge shows "Trial: X days left"
- 🚨 **Expiring Soon**: Red indicator when 1 day or less remains
- 🔒 **Expired**: Modal blocks app activities with upgrade prompt

### 3. Database Schema

#### Tables Created
```sql
-- User subscriptions table
public.user_subscriptions
  - id (uuid)
  - user_id (uuid) → references auth.users
  - plan_type (text) → 'king_elite'
  - status (text) → 'trial' | 'active' | 'expired' | 'cancelled'
  - trial_started_at (timestamptz)
  - trial_ends_at (timestamptz)
  - subscription_started_at (timestamptz)
  - payment_reference (text)
  - amount_paid_kobo (integer)

-- User trial activities tracking
public.user_trial_activities
  - id (uuid)
  - user_id (uuid) → references auth.users
  - activity_type (text)
  - activity_data (jsonb)
  - created_at (timestamptz)
```

#### Functions Created
- `is_user_in_trial(user_uuid)` → Returns boolean
- `has_active_subscription(user_uuid)` → Returns boolean
- `get_user_subscription_status(user_uuid)` → Returns jsonb

### 4. API Endpoints

#### Trial Management
- `POST /api/subscription/create-trial` - Create trial for new user
- `GET /api/subscription/status?userId={id}` - Get subscription status
- `POST /api/subscription/convert-trial` - Convert trial to paid

#### Usage Example
```typescript
// Create trial on sign-up
const response = await fetch('/api/subscription/create-trial', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ userId: user.id })
});

// Check subscription status
const status = await fetch(`/api/subscription/status?userId=${userId}`);
const data = await status.json();
console.log(data.subscription); // { trial_active, subscription_active, ... }
```

### 5. User Flow

#### Sign-Up Flow
1. User clicks "Start 4-Day FREE Trial" on homepage
2. Redirected to sign-up page with `?plan=king_elite_trial`
3. After successful sign-up, trial subscription is created automatically
4. User redirected to dashboard with full access

#### Trial Active
- User sees trial status badge in navigation
- All King Elite features are accessible
- Trial activities are tracked in database

#### Trial Expiring (1 day left)
- Navigation badge turns red
- User sees "Expiring Soon" indicator
- Prompted to upgrade before trial ends

#### Trial Expired
- App activities are blocked
- Modal overlay shows trial expired message
- User must upgrade to continue
- "Upgrade Now" button redirects to payment page

#### Payment & Upgrade
1. User clicks "Upgrade Now" or navigates to payment
2. Pays ₦1,200 via Paystack
3. Webhook converts trial to paid subscription
4. User gains unlimited access

### 6. Components Added

#### `TrialStatus.tsx`
- Shows trial countdown in navigation
- Expandable dropdown with trial details
- Upgrade button

#### `TrialRestriction.tsx`
- Modal that blocks app activities
- Shows trial expired message
- Lists locked features
- Upgrade call-to-action

#### `useSubscription.tsx`
- React hook for subscription management
- Checks trial/subscription status
- Validates action permissions

### 7. Integration Points

#### Homepage (`src/app/page.tsx`)
- Displays single King Elite plan
- Shows "4 DAYS FREE TRIAL!" badge
- Lists trial benefits
- CTA: "Start 4-Day FREE Trial"

#### Sign-Up (`src/app/sign-up/page.tsx`)
- Detects `?plan=king_elite_trial` parameter
- Creates trial subscription on success
- Redirects to dashboard

#### Navigation (`src/components/nav.tsx`)
- Shows `TrialStatus` component
- Displays trial countdown
- Mobile and desktop views

#### Customer Dashboard (`src/app/customer/page.tsx`)
- Integrates `TrialRestriction` component
- Checks permissions before actions
- Shows upgrade prompt when trial expires

#### Payment Webhook (`src/app/api/payments/webhook/route.ts`)
- Automatically converts trial to paid on successful payment
- Updates subscription status to 'active'
- Stores payment reference

### 8. Testing

#### Test Trial Creation
```bash
# Sign up with trial plan
curl -X POST http://localhost:3000/api/subscription/create-trial \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-uuid-here"}'
```

#### Test Subscription Status
```bash
# Check subscription status
curl http://localhost:3000/api/subscription/status?userId=user-uuid-here
```

#### Manual Database Check
```sql
-- Check user's subscription
SELECT * FROM user_subscriptions WHERE user_id = 'user-uuid-here';

-- Check trial expiration
SELECT 
  user_id, 
  status, 
  trial_ends_at,
  trial_ends_at - NOW() as time_remaining
FROM user_subscriptions 
WHERE user_id = 'user-uuid-here';
```

### 9. Migration Instructions

#### Apply Database Migration
```bash
# Run the migration in Supabase SQL Editor
# File: supabase/migrations/20250121_subscription_trial_system.sql
```

Or use Supabase CLI:
```bash
supabase migration up
```

### 10. Configuration

#### Environment Variables (Already Set)
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYSTACK_SECRET_KEY=your-paystack-secret
```

### 11. Future Enhancements

#### Possible Additions
- Email notifications for trial expiration
- Grace period after trial ends
- Prorated refunds
- Multiple subscription tiers
- Recurring subscriptions
- Trial extension for specific users

### 12. Support & Troubleshooting

#### Common Issues

**Issue**: Trial not created on sign-up
- **Solution**: Check API endpoint `/api/subscription/create-trial`
- **Logs**: Check browser console and server logs

**Issue**: Trial restriction not showing
- **Solution**: Verify `useSubscription` hook is properly integrated
- **Check**: User ID is being passed correctly

**Issue**: Payment doesn't upgrade trial
- **Solution**: Check webhook is properly configured
- **Verify**: Paystack webhook signature is valid

#### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('debug_subscription', 'true');

// Check subscription status
const { subscriptionStatus } = useSubscription();
console.log('Subscription Status:', subscriptionStatus);
```

### 13. Key Files Modified

```
src/
├── app/
│   ├── page.tsx                          # Updated wealth plan section
│   ├── sign-up/page.tsx                  # Added trial creation logic
│   ├── customer/page.tsx                 # Added trial restrictions
│   ├── payment/page.tsx                  # Updated plan details
│   └── api/
│       ├── subscription/
│       │   ├── create-trial/route.ts     # NEW: Create trial
│       │   ├── status/route.ts           # NEW: Check status
│       │   └── convert-trial/route.ts    # NEW: Convert to paid
│       └── payments/webhook/route.ts     # Updated with trial conversion
├── components/
│   ├── nav.tsx                           # Added trial status display
│   ├── TrialStatus.tsx                   # NEW: Trial countdown badge
│   └── TrialRestriction.tsx              # NEW: Restriction modal
├── hooks/
│   └── useSubscription.tsx               # NEW: Subscription management hook
├── lib/
│   └── subscription.ts                   # NEW: Subscription utilities
└── supabase/
    └── migrations/
        └── 20250121_subscription_trial_system.sql  # NEW: Database schema
```

## Summary

✅ **Completed Features**:
1. Free Foundation plan removed
2. King Elite with 4-day trial implemented
3. Trial countdown in navigation
4. Trial expiration restrictions
5. Automatic trial-to-paid conversion
6. Database schema and functions
7. API endpoints for subscription management
8. UI components for trial status and restrictions

🎯 **User Experience**:
- Clear trial period indication
- Full access during trial
- Graceful transition to paid
- Blocked activities after expiration
- Easy upgrade process

💡 **Benefits**:
- Encourages user engagement during trial
- Clear value proposition
- Seamless payment conversion
- Protects premium features
- Tracks user activity

---

For questions or support, refer to the code documentation or contact the development team.










