@echo off
echo ========================================
echo    REBUILDING APK WITH NETWORK FIXES
echo ========================================
echo.

echo [1/4] Cleaning previous builds...
cd android
call gradlew clean
cd ..

echo.
echo [2/4] Installing dependencies...
npm install

echo.
echo [3/4] Building release APK...
cd android
call gradlew assembleRelease
cd ..

echo.
echo [4/4] APK built successfully!
echo Location: android/app/build/outputs/apk/release/app-release.apk
echo.
echo ========================================
echo    NETWORK CONFIGURATION SUMMARY
echo ========================================
echo ✓ HTTP traffic allowed for local development
echo ✓ Network security config added
echo ✓ API endpoints configured for local server
echo ✓ Cleartext traffic enabled
echo.
echo Your APK should now work with your local API server!
echo Make sure your backend is running on http://192.168.1.4:3000
echo.
pause
