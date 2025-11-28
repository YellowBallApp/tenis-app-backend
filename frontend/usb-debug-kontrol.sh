#!/bin/bash

# USB Debug İzni Kontrol Scripti

echo "📱 USB Debug İzni Kontrolü"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ADB sunucusunu yeniden başlat
echo "🔄 ADB sunucusu yeniden başlatılıyor..."
adb kill-server
sleep 2
adb start-server
sleep 3

echo ""
echo "📱 Cihazları kontrol ediyorum..."
DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')

if [ "$DEVICES" -eq 0 ]; then
    echo ""
    echo "❌ Telefon görünmüyor!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔧 LÜTFEN TELEFONUNUZDA ŞUNLARI YAPIN:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1️⃣ USB Bağlantı Bildirimine Dokunun:"
    echo "   - Telefonunuzda USB bağlantı bildirimine dokunun"
    echo "   - 'Dosya Aktarımı' veya 'MTP' seçin"
    echo ""
    echo "2️⃣ USB Debugging İzni Verin:"
    echo "   - Telefonda 'USB Debugging İzni Ver?' penceresi çıkmalı"
    echo "   - 'İZİN VER' veya 'ALLOW' butonuna basın"
    echo "   - 'Bu bilgisayardan her zaman izin ver' kutusunu işaretleyin"
    echo ""
    echo "3️⃣ Geliştirici Seçeneklerini Kontrol Edin:"
    echo "   - Ayarlar → Geliştirici Seçenekleri"
    echo "   - 'USB Debugging' AÇIK olmalı ✓"
    echo "   - 'USB ile yükleme' AÇIK olmalı (varsa) ✓"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "⏳ 10 saniye bekliyorum, lütfen yukarıdaki adımları yapın..."
    echo ""
    
    for i in {10..1}; do
        echo -ne "\r   $i saniye kaldı...   "
        sleep 1
    done
    echo -e "\r                                        "
    
    echo ""
    echo "🔍 Tekrar kontrol ediyorum..."
    adb devices
    
    DEVICES=$(adb devices | grep -v "List" | grep "device" | wc -l | tr -d ' ')
    
    if [ "$DEVICES" -eq 0 ]; then
        echo ""
        echo "❌ Hala görünmüyor!"
        echo ""
        echo "💡 DENEYEBİLECEKLERİNİZ:"
        echo "   1. USB kablosunu çıkarıp tekrar takın"
        echo "   2. Farklı bir USB portu deneyin"
        echo "   3. Farklı bir USB kablosu deneyin"
        echo "   4. Telefonu yeniden başlatın"
        echo "   5. Bilgisayarı yeniden başlatın"
        echo ""
        echo "   Sonra bu script'i tekrar çalıştırın:"
        echo "   ./usb-debug-kontrol.sh"
        exit 1
    fi
fi

echo ""
echo "✅ Telefon bağlı!"
echo ""
adb devices -l

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Uygulama Kontrolü:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if adb shell pm list packages 2>/dev/null | grep -q "com.tenisapp.frontend"; then
    echo "✅ Uygulama yüklü!"
    echo ""
    echo "🚀 Uygulamayı başlatıyorum..."
    adb shell am start -n com.tenisapp.frontend/.MainActivity
    echo ""
    echo "✅ Uygulama başlatıldı!"
else
    echo "❌ Uygulama yüklü değil!"
    echo ""
    echo "📦 Uygulamayı yüklemek için APK oluşturuyorum..."
    cd android
    if [ -f "app/build/outputs/apk/debug/app-debug.apk" ]; then
        echo "✅ APK zaten var, yüklüyorum..."
        cd ..
        adb install -r android/app/build/outputs/apk/debug/app-debug.apk
    else
        echo "🔨 APK oluşturuluyor (bu biraz zaman alabilir)..."
        ./gradlew assembleDebug
        cd ..
        echo "📱 APK yükleniyor..."
        adb install -r android/app/build/outputs/apk/debug/app-debug.apk
    fi
    echo ""
    echo "✅ Yükleme tamamlandı!"
    echo "🚀 Uygulamayı başlatıyorum..."
    adb shell am start -n com.tenisapp.frontend/.MainActivity
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ TAMAMLANDI!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📝 Şimdi logları izlemek için başka bir terminal açın ve:"
echo "   adb logcat | grep -E '(FATAL|AndroidRuntime|Boolean|TENIS_APP_ERROR)'"
echo ""

