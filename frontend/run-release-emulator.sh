#!/bin/bash

# Release build ile emülatörde çalıştırma scripti
# Bu script, uygulamayı release build olarak derleyip emülatöre yükler
# Böylece gerçek telefon davranışına yakın test yapabilirsiniz

echo "🚀 Release Build ile Emülatör Çalıştırılıyor..."
echo ""
echo "⚠️  ÖNEMLİ:"
echo "   - Bu işlem release build (production) modunda çalıştırır"
echo "   - Gerçek telefon davranışına yakın test yapılır"
echo "   - Build işlemi biraz zaman alabilir (5-10 dakika)"
echo "   - Android emülatörün açık olduğundan emin olun"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Script'in bulunduğu dizini al
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR"

# Metro bundler'ı durdur (varsa)
echo "📦 Mevcut Metro bundler durduruluyor..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true

# Android build klasörünü temizle
echo ""
echo "🧹 Build klasörü temizleniyor..."
cd "$FRONTEND_DIR/android"
./gradlew clean

# Release build oluştur
echo ""
echo "🔨 Release build oluşturuluyor (bu biraz zaman alabilir)..."
./gradlew assembleRelease

# APK'yı emülatöre yükle
echo ""
echo "📱 APK emülatöre yükleniyor..."
cd "$FRONTEND_DIR"
npx expo run:android --variant release --device

echo ""
echo "✅ Tamamlandı! Uygulama release modunda emülatörde çalışıyor."
echo "📝 Not: Logları görmek için: adb logcat | grep ReactNativeJS"

