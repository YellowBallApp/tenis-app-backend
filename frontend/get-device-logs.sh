#!/bin/bash

# Gerçek telefon loglarını çekme scripti
# Bu script, Android telefonunuzdan detaylı logları alır

echo "📱 Android Cihaz Logları Çekiliyor..."
echo ""

# Cihaz kontrolü
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ Bağlı Android cihaz bulunamadı!"
    echo "   Lütfen telefonunuzun USB debug modunu açın ve bağlayın."
    exit 1
fi

echo "✅ Cihaz bulundu:"
adb devices
echo ""

# Log dosyası oluştur
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="device_logs_${TIMESTAMP}.txt"

echo "📝 Loglar kaydediliyor: $LOG_FILE"
echo ""

# Boolean casting hatalarını özellikle ara
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Boolean Casting Hataları Aranıyor..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Tüm logları temizle ve yeni logları yakala
adb logcat -c

echo "⏳ Uygulamayı telefonunuzda açın ve hatayı tekrarlayın..."
echo "   (Loglar 30 saniye boyunca kaydedilecek)"
echo ""

# 30 saniye boyunca logları yakala ve kaydet
timeout 30 adb logcat > "$LOG_FILE" 2>&1 || adb logcat -d > "$LOG_FILE" 2>&1

echo ""
echo "✅ Loglar kaydedildi: $LOG_FILE"
echo ""

# Boolean casting hatalarını filtrele
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Boolean Casting Hataları:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -i -E "(Boolean|cast|String cannot be cast)" "$LOG_FILE" | head -20 || echo "Boolean casting hatası bulunamadı (bu iyi bir şey!)"
echo ""

# Tüm hataları göster
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Tüm Hatalar (FATAL, ERROR):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "(FATAL|AndroidRuntime|ERROR)" "$LOG_FILE" | tail -50 || echo "Hata bulunamadı"
echo ""

# TENIS_APP_ERROR tag'li loglar
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Uygulama Özel Logları (TENIS_APP_ERROR):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "TENIS_APP_ERROR" "$LOG_FILE" || echo "Özel log bulunamadı"
echo ""

echo "📄 Tam log dosyası: $LOG_FILE"
echo "   Bu dosyayı geliştirici ile paylaşabilirsiniz."

