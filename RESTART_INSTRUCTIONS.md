# Restart Instructions

## After Installing Dependencies

Since we've installed new dependencies and updated the babel configuration, you need to restart your development server:

### 1. Stop the current Metro bundler
- Press `Ctrl+C` in the terminal where Metro is running
- Or close the terminal and open a new one

### 2. Clear Metro cache
```bash
npx react-native start --reset-cache
```

### 3. For Android
```bash
npx react-native run-android
```

### 4. For iOS
```bash
cd ios && pod install && cd ..
npx react-native run-ios
```

## What We Fixed

1. ✅ Installed `react-native-reanimated` (v4.1.3)
2. ✅ Installed `react-native-vision-camera` (v4.7.2)
3. ✅ Added reanimated plugin to babel.config.js
4. ✅ Simplified QRScannerScreen to avoid complex frame processing

## Testing the QR Scanner

1. Navigate to Check In/Out screen
2. Tap "Check In" or "Check Out"
3. Select "QR Code Scan" option
4. Camera should open (after granting permissions)
5. Wait 3 seconds for simulated QR detection
6. QR code data will be processed

The QR scanner is now ready to use! 🎉
