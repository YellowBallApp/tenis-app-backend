#!/bin/bash

# TÜM logları çekme scripti - Native ve JS logları dahil
# Bu script, gerçek telefonda görünen hataları yakalar

echo "📱 TÜM ANDROID LOGLARI ÇEKİLİYOR..."
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
LOG_FILE="all_logs_${TIMESTAMP}.txt"

echo "📝 TÜM loglar kaydediliyor: $LOG_FILE"
echo ""
echo "⚠️  ÖNEMLİ: Bu script TÜM logları kaydeder (çok büyük dosya olabilir)"
echo ""

# Mevcut logları temizle
echo "🧹 Mevcut loglar temizleniyor..."
adb logcat -c
sleep 2

echo "⏳ Uygulamayı telefonunuzda açın veya hatayı tekrarlayın..."
echo "   Loglar 60 saniye boyunca kaydedilecek..."
echo "   (Ctrl+C ile erken durdurabilirsiniz)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Tüm logları yakala (60 saniye veya manuel durdurma)
timeout 60 adb logcat > "$LOG_FILE" 2>&1 || adb logcat -d > "$LOG_FILE" 2>&1

echo ""
echo "✅ Loglar kaydedildi: $LOG_FILE"
echo ""

# Dosya boyutu
FILE_SIZE=$(du -h "$LOG_FILE" | cut -f1)
echo "📊 Dosya boyutu: $FILE_SIZE"
echo ""

# Şimdi önemli logları filtrele ve göster
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 FATAL HATALAR (Uygulama Çökmesi):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -i "FATAL" "$LOG_FILE" | tail -30 || echo "FATAL hata bulunamadı"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 AndroidRuntime HATALARI (Java/Kotlin Hataları):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -i "AndroidRuntime" "$LOG_FILE" | tail -50 || echo "AndroidRuntime hatası bulunamadı"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Boolean Casting HATALARI:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -i -E "(Boolean|cast|ClassCastException|String cannot be cast)" "$LOG_FILE" | tail -30 || echo "Boolean casting hatası bulunamadı"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Uygulama Özel Logları (TENIS_APP_ERROR):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "TENIS_APP_ERROR" "$LOG_FILE" || echo "Özel log bulunamadı"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 TÜM ERROR Seviyesi Loglar:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep -E "ERROR|E/" "$LOG_FILE" | grep -v "ReactNativeJS" | tail -50 || echo "ERROR log bulunamadı"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 React Native JS Logları:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
grep "ReactNativeJS" "$LOG_FILE" | tail -30 || echo "ReactNativeJS log bulunamadı"
echo ""

# Önemli hataları ayrı bir dosyaya kaydet
ERROR_LOG_FILE="errors_only_${TIMESTAMP}.txt"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📄 Önemli hatalar ayrı bir dosyaya kaydediliyor: $ERROR_LOG_FILE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

{
  echo "=== FATAL HATALAR ==="
  grep -i "FATAL" "$LOG_FILE" || echo "FATAL hata bulunamadı"
  echo ""
  echo "=== AndroidRuntime HATALARI ==="
  grep -i "AndroidRuntime" "$LOG_FILE" || echo "AndroidRuntime hatası bulunamadı"
  echo ""
  echo "=== Boolean Casting HATALARI ==="
  grep -i -E "(Boolean|cast|ClassCastException|String cannot be cast)" "$LOG_FILE" || echo "Boolean casting hatası bulunamadı"
  echo ""
  echo "=== Uygulama Özel Logları ==="
  grep "TENIS_APP_ERROR" "$LOG_FILE" || echo "Özel log bulunamadı"
  echo ""
  echo "=== ERROR Seviyesi Loglar ==="
  grep -E "ERROR|E/" "$LOG_FILE" | grep -v "ReactNativeJS" | head -100 || echo "ERROR log bulunamadı"
} > "$ERROR_LOG_FILE"

ERROR_SIZE=$(du -h "$ERROR_LOG_FILE" | cut -f1)
echo ""
echo "✅ Önemli hatalar kaydedildi: $ERROR_LOG_FILE ($ERROR_SIZE)"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ÖZET:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  • Tüm loglar: $LOG_FILE ($FILE_SIZE)"
echo "  • Sadece hatalar: $ERROR_LOG_FILE ($ERROR_SIZE)"
echo ""
echo "💡 İPUCU:"
echo "  - Eğer hata görünmüyorsa, '$ERROR_LOG_FILE' dosyasını kontrol edin"
echo "  - Hata native tarafında ise 'AndroidRuntime' bölümünde olacak"
echo "  - Boolean casting hatası için 'Boolean Casting' bölümüne bakın"
echo ""

