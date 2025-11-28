#!/bin/bash

# Telefon Bağlantı Kurulum Scripti

echo "📱 Android Telefon Bağlantı Kurulumu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 1. ADB sunucusunu yeniden başlat
echo "🔄 ADB sunucusu yeniden başlatılıyor..."
adb kill-server
sleep 2
adb start-server
sleep 2

echo ""
echo "1️⃣ Telefon Bağlantısı Kontrolü:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
    echo "❌ Telefon bağlı değil!"
    echo ""
    echo "📋 LÜTFEN ŞUNLARI YAPIN:"
    echo ""
    echo "1. Telefonunuzu USB kablosu ile bilgisayara bağlayın"
    echo ""
    echo "2. Telefonunuzda USB Debugging'i açın:"
    echo "   - Ayarlar → Telefon Hakkında"
    echo "   - Yapı Numarası'na 7 kez dokunun"
    echo "   - Ayarlar → Geliştirici Seçenekleri"
    echo "   - USB Debugging'i AÇIN"
    echo "   - USB ile yükleme'yi açın (varsa)"
    echo ""
    echo "3. USB bağlantı türünü seçin:"
    echo "   - Telefonda bildirime dokunun"
    echo "   - 'Dosya Aktarımı' veya 'MTP' seçin"
    echo ""
    echo "4. USB Debugging izni verin:"
    echo "   - Telefonda çıkan 'USB Debugging İzni Ver?' penceresinde"
    echo "   - 'İzin Ver' veya 'Allow' seçin"
    echo "   - 'Bu bilgisayardan her zaman izin ver' kutusunu işaretleyin"
    echo ""
    echo "5. Bu script'i tekrar çalıştırın:"
    echo "   ./telefon-baglanti-kur.sh"
    echo ""
    
    # Tekrar kontrol et
    echo "⏳ 5 saniye bekleniyor, lütfen telefonunuzu bağlayın..."
    sleep 5
    adb devices
    
    exit 1
else
    echo "✅ Telefon bağlı!"
    adb devices -l
fi

echo ""
echo "2️⃣ Uygulama Kontrolü:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if adb shell pm list packages | grep -q "com.tenisapp.frontend"; then
    echo "✅ Uygulama yüklü"
    echo ""
    echo "🚀 Uygulamayı başlatıyoruz..."
    adb shell am start -n com.tenisapp.frontend/.MainActivity
    echo ""
    echo "📝 Logları izliyoruz (30 saniye)..."
    echo ""
    adb logcat -c
    timeout 30 adb logcat | grep -E "(com.tenisapp|AndroidRuntime|FATAL|Boolean)" || adb logcat -d | grep -E "(com.tenisapp|AndroidRuntime|FATAL|Boolean)" | tail -30
else
    echo "❌ Uygulama yüklü değil!"
    echo ""
    echo "📦 Uygulamayı yüklemek ister misiniz? (y/n)"
    read -r answer
    if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
        echo ""
        echo "🔨 Debug APK oluşturuluyor..."
        cd android
        ./gradlew assembleDebug
        echo ""
        echo "📱 APK yükleniyor..."
        adb install -r app/build/outputs/apk/debug/app-debug.apk
        echo ""
        echo "✅ Yükleme tamamlandı!"
        echo "🚀 Uygulamayı başlatıyoruz..."
        adb shell am start -n com.tenisapp.frontend/.MainActivity
    else
        echo "Uygulama yükleme iptal edildi."
    fi
fi

