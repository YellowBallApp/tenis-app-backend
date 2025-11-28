#!/bin/bash

# Native Error Yakalama Script'i
# Bu script native (Java/Kotlin) hatalarını yakalar ve dosyaya kaydeder

echo "🔍 Native hata yakalama başlatılıyor..."
echo ""

# ADB kontrolü
if ! command -v adb &> /dev/null; then
    echo "❌ ADB bulunamadı! Lütfen Android SDK'yı yükleyin."
    exit 1
fi

# Cihaz kontrolü
DEVICE_COUNT=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')

if [ "$DEVICE_COUNT" -eq 0 ]; then
    echo "❌ Bağlı cihaz bulunamadı!"
    echo "Lütfen telefonunuzu USB ile bağlayın ve USB Debugging'i açın."
    adb devices
    exit 1
fi

echo "✅ Cihaz bağlı: $(adb devices | grep -v "List" | grep "device" | head -1 | cut -f1)"
echo ""

# Log dosyası oluştur
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="native_error_${TIMESTAMP}.txt"

echo "📝 Log dosyası: $LOG_FILE"
echo ""

# Log buffer'ı artır (16MB)
echo "📊 Log buffer'ı artırılıyor..."
adb logcat -G 16M

# Mevcut logları temizle
echo "🧹 Eski loglar temizleniyor..."
adb logcat -c

echo ""
echo "🎯 Hata yakalama başladı!"
echo "📱 Şimdi telefonunuzda uygulamayı açın..."
echo "⏱️  60 saniye log kaydedilecek..."
echo "⏸️  Durdurmak için Ctrl+C basın"
echo ""
echo "=" | tee -a "$LOG_FILE"
echo "NATIVE ERROR LOG - $(date)" | tee -a "$LOG_FILE"
echo "=" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Logları yakala ve dosyaya yaz
# Boolean casting hataları, AndroidRuntime hataları ve tüm ERROR/FATAL logları
adb logcat -v time \
  AndroidRuntime:E \
  TENIS_APP_ERROR:E \
  ReactNativeJS:E \
  *:F \
  2>&1 | tee -a "$LOG_FILE" &
  
LOG_PID=$!

# 60 saniye bekle
sleep 60

# Log process'i durdur
kill $LOG_PID 2>/dev/null
wait $LOG_PID 2>/dev/null

echo ""
echo "✅ Log kaydı tamamlandı!"
echo ""
echo "📋 Logları analiz ediliyor..."

# Boolean casting hatalarını özel olarak göster
BOOLEAN_ERRORS=$(grep -i "Boolean\|cast\|ClassCastException" "$LOG_FILE" | wc -l | tr -d ' ')

if [ "$BOOLEAN_ERRORS" -gt 0 ]; then
    echo ""
    echo "⚠️  BOOLEAN CASTING HATASI BULUNDU! ($BOOLEAN_ERRORS satır)"
    echo ""
    echo "🔍 Boolean casting hataları:"
    echo "---"
    grep -i "Boolean\|cast\|ClassCastException" "$LOG_FILE" | head -20
    echo "---"
    echo ""
fi

# FATAL hataları göster
FATAL_ERRORS=$(grep -i "FATAL" "$LOG_FILE" | wc -l | tr -d ' ')

if [ "$FATAL_ERRORS" -gt 0 ]; then
    echo "⚠️  FATAL HATA BULUNDU! ($FATAL_ERRORS satır)"
    echo ""
    echo "🔍 FATAL hatalar:"
    echo "---"
    grep -i "FATAL" "$LOG_FILE" | head -20
    echo "---"
    echo ""
fi

# AndroidRuntime hatalarını göster
RUNTIME_ERRORS=$(grep -i "AndroidRuntime" "$LOG_FILE" | wc -l | tr -d ' ')

if [ "$RUNTIME_ERRORS" -gt 0 ]; then
    echo "⚠️  AndroidRuntime HATASI BULUNDU! ($RUNTIME_ERRORS satır)"
    echo ""
    echo "🔍 AndroidRuntime hataları:"
    echo "---"
    grep -i "AndroidRuntime" "$LOG_FILE" | head -30
    echo "---"
    echo ""
fi

echo ""
echo "📁 Tüm loglar kaydedildi: $LOG_FILE"
echo ""
echo "💡 Logları görüntülemek için:"
echo "   cat $LOG_FILE"
echo ""
echo "💡 Boolean hatalarını görmek için:"
echo "   grep -i 'Boolean\\|cast' $LOG_FILE"
echo ""

