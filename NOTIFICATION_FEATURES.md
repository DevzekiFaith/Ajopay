# Wallet Deposit Notifications & Sound Features

## Overview

This document outlines the comprehensive notification and sound system implemented for wallet deposits in AjoPay. The system provides multi-layered feedback including sounds, visual notifications, and browser notifications.

## Features Implemented

### 1. Enhanced Sound System (`src/lib/sounds.ts`)

#### New Sound Types
- **Deposit Sound**: `deposit.mp3` - For regular wallet deposits
- **Coin Sound**: `coin.mp3` - For large deposits (500 NGN or more)
- **Notification Sound**: `notification.mp3` - General notification sound

#### Enhanced Functions
- `playDepositNotification(amount, isLargeDeposit)` - Plays appropriate sound based on deposit size
- `playTransactionSound()` - Updated to support new sound types

#### Sound Behavior
- **Regular Deposits**: Plays `deposit.mp3` + `notification.mp3` (200ms delay)
- **Large Deposits**: Plays `coin.mp3` + `notification.mp3` (200ms delay)
- **Volume Control**: Different volumes for different sound types

### 2. Wallet Page Enhancements (`src/app/wallet/page.tsx`)

#### Deposit Handler Improvements
- Enhanced `handleDeposit()` function with:
  - Visual toast notifications with custom styling
  - Sound notifications based on deposit amount
  - Browser notification requests and display
  - Large deposit detection (500 NGN threshold)

#### Real-time Subscription Enhancements
- Enhanced wallet transaction monitoring
- Enhanced contribution monitoring
- Automatic sound and notification triggers
- Visual feedback for all deposit types

#### Browser Notification Integration
- Permission request handling
- Custom notification display
- Different notifications for different deposit sizes

### 3. Notification System Enhancements (`src/components/Notifications/NotificationSystem.tsx`)

#### Enhanced Wallet Funding Notifications
- Large deposit detection and special handling
- Enhanced visual styling with gradients
- Sound integration
- Browser notification support
- Extended display duration for large deposits

#### Visual Improvements
- Custom toast styling with gradients
- Different colors for regular vs large deposits
- Icon integration
- Responsive design

### 4. Browser Notification Hook (`src/hooks/useBrowserNotifications.tsx`)

#### New Custom Hook
- `useBrowserNotifications()` - Manages browser notification permissions and display
- Permission state management
- Error handling
- Custom notification functions

#### Features
- Automatic permission detection
- Permission request handling
- Custom notification display
- Deposit-specific notification function
- Error handling and user feedback

### 5. Webhook Handler Enhancements (`src/app/api/payments/webhook/route.ts`)

#### Enhanced Payment Processing
- Large deposit detection in webhook
- Enhanced notification data with sound type information
- Wallet transaction record creation for real-time updates
- Improved metadata for notifications

#### Real-time Integration
- Automatic wallet transaction creation
- Enhanced notification data structure
- Sound type specification in notifications

### 6. Test Component (`src/components/Test/NotificationTest.tsx`)

#### Testing Interface
- Interactive test component for all notification features
- Sound testing functionality
- Browser notification testing
- Permission status display
- Amount-based testing

## Sound Files Required

Place the following sound files in `public/sounds/`:

1. `deposit.mp3` - Regular deposit sound
2. `coin.mp3` - Large deposit sound
3. `notification.mp3` - General notification sound
4. `transaction-complete.mp3` - Transaction completion sound
5. `success.mp3` - Success sound
6. `error.mp3` - Error sound

## Usage Examples

### Testing Notifications
```tsx
import { NotificationTest } from '@/components/Test/NotificationTest';

// Add to any page for testing
<NotificationTest />
```

### Using Browser Notifications
```tsx
import { useBrowserNotifications } from '@/hooks/useBrowserNotifications';

const { requestPermission, showDepositNotification } = useBrowserNotifications();

// Request permission
await requestPermission();

// Show deposit notification
showDepositNotification(amount, isLargeDeposit);
```

### Playing Deposit Sounds
```tsx
import { playDepositNotification } from '@/lib/sounds';

// Play sound for deposit
playDepositNotification(amountInKobo, isLargeDeposit);
```

## Configuration

### Large Deposit Threshold
- **Default**: 500 NGN (50,000 kobo)
- **Configurable**: Update threshold in relevant files

### Sound Volumes
- **Deposit Sound**: 0.7
- **Coin Sound**: 0.8
- **Notification Sound**: 0.5-0.6

### Notification Durations
- **Regular Deposits**: 5 seconds
- **Large Deposits**: 7 seconds
- **Browser Notifications**: Persistent until dismissed

## Browser Compatibility

- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support
- **Mobile Browsers**: Limited browser notification support

## Security Considerations

- Audio context initialized only on user interaction
- Permission requests handled gracefully
- Fallback handling for unsupported features
- No sensitive data in notifications

## Performance Considerations

- Sounds preloaded on initialization
- Efficient real-time subscription management
- Minimal memory footprint
- Automatic cleanup of event listeners

## Future Enhancements

1. **Custom Sound Upload**: Allow users to upload custom notification sounds
2. **Sound Preferences**: User settings for sound types and volumes
3. **Notification Scheduling**: Time-based notification preferences
4. **Push Notifications**: Service worker integration for background notifications
5. **Sound Themes**: Different sound themes for different user preferences
