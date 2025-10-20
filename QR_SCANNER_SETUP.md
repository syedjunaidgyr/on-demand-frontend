# QR Scanner Setup Guide

## Dependencies Required

To use the QR scanner functionality, you need to install the following dependencies:

### 1. Install react-native-vision-camera

```bash
npm install react-native-vision-camera
# or
yarn add react-native-vision-camera
```

### 2. Install react-native-reanimated (if not already installed)

```bash
npm install react-native-reanimated
# or
yarn add react-native-reanimated
```

## Platform Setup

### Android Setup

1. **Add permissions to `android/app/src/main/AndroidManifest.xml`:**
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
```

2. **Update `android/app/build.gradle`:**
```gradle
android {
    compileSdkVersion 33
    // ... other config
}
```

### iOS Setup

1. **Add permissions to `ios/LocumHealthcareApp/Info.plist`:**
```xml
<key>NSCameraUsageDescription</key>
<string>This app needs camera access to scan QR codes for check-in/check-out.</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for video recording.</string>
```

2. **Run pod install:**
```bash
cd ios && pod install
```

## Usage

The QR scanner is now integrated into your CheckInOutScreen. When users tap "Check In" or "Check Out", they'll see two options:

1. **Manual Check In/Out** - Traditional method without QR scanning
2. **QR Code Scan** - Opens the camera scanner

### Features

- ✅ Camera permission handling
- ✅ Real-time QR code detection
- ✅ Custom scanner UI with overlay
- ✅ Success/error feedback
- ✅ Integration with existing check-in/out API
- ✅ Cross-platform support (iOS & Android)

### Testing

To test the QR scanner:

1. Generate a QR code with any text (you can use online QR generators)
2. Navigate to Check In/Out screen
3. Tap "QR Code Scan" option
4. Point camera at the QR code
5. The scanner will detect and process the QR code

## Troubleshooting

### Common Issues

1. **Camera not working**: Check permissions in device settings
2. **Build errors**: Make sure to run `pod install` for iOS
3. **Scanner not detecting**: Ensure good lighting and steady camera positioning

### Network Error Fix

If you're getting network errors, make sure your backend server is running on the correct IP address. Update the API configuration in `src/config/api.ts` with your computer's actual IP address.

## Next Steps

1. Install the dependencies
2. Run the platform-specific setup
3. Test the QR scanner functionality
4. Customize the QR code format for your specific use case
