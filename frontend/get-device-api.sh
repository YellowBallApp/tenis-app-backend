#!/bin/bash

# Gerçek telefonun API seviyesini öğrenmek için script

echo "📱 Cihaz API Seviyesi Kontrolü"
echo ""

# Cihaz kontrolü
if ! adb devices | grep -q "device$"; then
    echo "❌ Cihaz bulunamadı! Lütfen telefonu bağlayın."
    exit 1
fi

echo "✅ Cihaz bağlı"
echo ""

# API seviyesini al
API_LEVEL=$(adb shell getprop ro.build.version.sdk)
API_CODENAME=$(adb shell getprop ro.build.version.codename)
RELEASE=$(adb shell getprop ro.build.version.release)
BUILD_ID=$(adb shell getprop ro.build.id)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Cihaz Bilgileri:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  • Android Sürümü: $RELEASE"
echo "  • API Seviyesi: $API_LEVEL"
echo "  • Codename: $API_CODENAME"
echo "  • Build ID: $BUILD_ID"
echo ""

# API seviyesine göre öneri
case $API_LEVEL in
  23|24|25)
    echo "⚠️  Android 6.0-7.1 (API $API_LEVEL)"
    echo "   Bu sürümler eski, boolean handling farklı olabilir"
    ;;
  26|27|28)
    echo "✅ Android 8.0-9.0 (API $API_LEVEL)"
    echo "   Bu sürümler genellikle sorunsuz çalışır"
    ;;
  29|30|31)
    echo "✅ Android 10-12 (API $API_LEVEL)"
    echo "   Modern sürümler"
    ;;
  32|33|34)
    echo "✅ Android 12-14 (API $API_LEVEL)"
    echo "   Çok yeni sürümler"
    ;;
  35|36)
    echo "✅ Android 15+ (API $API_LEVEL)"
    echo "   En yeni sürümler - Preview/Extension olabilir"
    ;;
  *)
    echo "⚠️  Bilinmeyen API seviyesi: $API_LEVEL"
    ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💡 Öneriler:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$API_CODENAME" != "REL" ] && [ "$API_CODENAME" != "" ]; then
    echo "⚠️  Bu bir Preview/Beta sürümü olabilir (codename: $API_CODENAME)"
    echo "   Preview sürümlerde boolean handling farklı olabilir"
    echo ""
fi

echo "   • Min SDK: 23 (Android 6.0+)"
echo "   • Target SDK: 34 (Android 14)"
echo "   • Eğer API $API_LEVEL'de sorun varsa, build.gradle'da kontrol edin"
echo ""

