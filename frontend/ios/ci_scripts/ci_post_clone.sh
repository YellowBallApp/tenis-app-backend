#!/bin/sh

# Xcode Cloud Build Script
# Bu script, Xcode Cloud build başlamadan önce çalışır
# CocoaPods bağımlılıklarını yükler

set -e

echo "🚀 Xcode Cloud Build Script başlatılıyor..."

# Proje kök dizinine git
cd "$CI_WORKSPACE"

# Frontend dizinine git
if [ -d "frontend" ]; then
    cd frontend
    echo "✅ Frontend dizini bulundu"
else
    echo "⚠️  Frontend dizini bulunamadı, mevcut dizinde devam ediliyor"
fi

# Node.js versiyonunu kontrol et
if command -v node &> /dev/null; then
    echo "✅ Node.js bulundu: $(node --version)"
else
    echo "❌ Node.js bulunamadı!"
    exit 1
fi

# npm versiyonunu kontrol et
if command -v npm &> /dev/null; then
    echo "✅ npm bulundu: $(npm --version)"
else
    echo "❌ npm bulunamadı!"
    exit 1
fi

# Node.js bağımlılıklarını yükle
echo "📦 Node.js bağımlılıkları yükleniyor..."
if [ -f "package-lock.json" ]; then
    npm ci
else
    npm install
fi
echo "✅ Node.js bağımlılıkları yüklendi"

# iOS dizinine git
cd ios

# CocoaPods versiyonunu kontrol et
if command -v pod &> /dev/null; then
    echo "✅ CocoaPods bulundu: $(pod --version)"
else
    echo "❌ CocoaPods bulunamadı!"
    echo "⚠️  Xcode Cloud'da CocoaPods genellikle önceden yüklüdür. Lütfen Xcode Cloud ayarlarını kontrol edin."
    exit 1
fi

# CocoaPods bağımlılıklarını yükle
echo "📦 CocoaPods bağımlılıkları yükleniyor..."
pod install --repo-update
echo "✅ CocoaPods bağımlılıkları yüklendi"

# Pods klasörünün oluşturulduğunu kontrol et
if [ -d "Pods" ]; then
    echo "✅ Pods klasörü başarıyla oluşturuldu"
    
    # xcconfig dosyasının varlığını kontrol et
    if [ -f "Pods/Target Support Files/Pods-TenisApp/Pods-TenisApp.release.xcconfig" ]; then
        echo "✅ Pods-TenisApp.release.xcconfig dosyası bulundu"
    else
        echo "⚠️  Pods-TenisApp.release.xcconfig dosyası bulunamadı, ancak build devam edebilir"
    fi
else
    echo "❌ Pods klasörü oluşturulamadı!"
    exit 1
fi

echo "🎉 Build hazırlığı tamamlandı!"
