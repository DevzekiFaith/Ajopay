# Sound System for Ajopay

This directory is for sound files used in the Ajopay application, but the system is designed to work without any sound files.

## Current State

**No sound files are currently required!** The application uses a robust fallback system that generates audio tones when sound files are missing.

## How It Works

The sound system follows this priority order:

1. **Try to load the requested sound file** (e.g., `deposit.mp3`)
2. **Try fallback sound file** (e.g., `deposit.mp3` falls back to `success.mp3`)
3. **Generate audio tone** using Web Audio API as final fallback

## Generated Audio Tones

When sound files are missing, the system generates different audio patterns:

- **Deposit**: Double tone at 1000Hz
- **Coin** (large deposits): Triple tone at 1200Hz  
- **Notification**: Single tone at 600Hz
- **Success**: Double tone at 800Hz
- **Error**: Single tone at 400Hz

## Adding Sound Files (Optional)

If you want to add custom sound files, place them in this directory:

- `deposit.mp3` - For wallet deposits
- `coin.mp3` - For large deposits (500+ NGN)
- `notification.mp3` - For general notifications
- `success.mp3` - For successful operations
- `error.mp3` - For error conditions
- `transaction-complete.mp3` - For completed transactions

## File Requirements

- **Format**: MP3 (for maximum browser compatibility)
- **Size**: Keep files small for fast loading
- **Quality**: 44.1kHz sample rate recommended

## Benefits of Current System

✅ **No dependencies** - Works without any sound files  
✅ **Always functional** - Generated tones ensure sounds always play  
✅ **Customizable** - Easy to add real sound files later  
✅ **Lightweight** - No large audio files to download  
✅ **Consistent** - Same experience across all environments  

## Sound Usage

The sounds are used for:

- **Regular Deposits**: `deposit.mp3` + `notification.mp3` (with 200ms delay)
- **Large Deposits**: `coin.mp3` + `notification.mp3` (with 200ms delay)
- **General Notifications**: `notification.mp3`
- **Success Actions**: `success.mp3`
- **Error Actions**: `error.mp3`

## Browser Compatibility

- Modern browsers support MP3 format
- Fallback handling is implemented for unsupported browsers
- Audio context is initialized on user interaction to comply with browser policies

The sound system is designed to be robust and user-friendly, providing audio feedback even when no sound files are available!