#!/bin/bash
# APK build durumunu kontrol et

APK_PATH="/Users/bariscandemirel/Desktop/tenis_app/frontend/android/app/build/outputs/apk/release/app-release.apk"

echo "🔍 APK build durumu kontrol ediliyor..."
echo ""

if [ -f "$APK_PATH" ]; then
    echo "✅ APK başarıyla oluşturuldu!"
    echo ""
    echo "📦 APK Bilgileri:"
    ls -lh "$APK_PATH"
    echo ""
    echo "📍 Konum: $APK_PATH"
    echo ""
    echo "📱 Telefona yüklemek için:"
    echo "   adb install $APK_PATH"
else
    echo "⏳ APK henüz oluşmadı. Build devam ediyor..."
    echo ""
    echo "Build durumunu kontrol etmek için:"
    echo "   cd frontend/android && ./gradlew assembleRelease"
fi

