#!/bin/bash

# HATA LOGLAMA SCRIPT'İ
# Bu script native hataları yakalar ve ekranda gösterir

echo "🔍 Native Hata Yakalama Başlatılıyor..."
echo ""

# Cihaz kontrolü
if ! adb devices | grep -q "device$"; then
    echo "❌ Cihaz bulunamadı! Lütfen telefonu bağlayın."
    exit 1
fi

echo "✅ Cihaz bağlı"
echo ""

# Logları temizle
echo "🧹 Loglar temizleniyor..."
adb logcat -c

echo ""
echo "📱 ŞİMDİ TELEFONDA UYGULAMAYI AÇIN!"
echo "⏱️  60 saniye log kaydediliyor..."
echo ""

# Hataları canlı izle
adb logcat -v time \
  AndroidRuntime:E \
  TENIS_APP_ERROR:* \
  *:F \
  | grep --line-buffered -i -E "(Boolean|cast|ClassCastException|FATAL|AndroidRuntime|TENIS_APP_ERROR)" \
  | while read line; do
      echo "$line"
      if echo "$line" | grep -qi "Boolean\|cast"; then
          echo "⚠️  ⚠️  ⚠️  BOOLEAN CASTING HATASI BULUNDU! ⚠️  ⚠️  ⚠️"
      fi
    done

