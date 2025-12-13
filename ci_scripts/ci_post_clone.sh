#!/bin/sh

# Xcode Cloud Build Script
# Bu script, Xcode Cloud build başlamadan önce çalışır
# CocoaPods bağımlılıklarını yükler

# Hata ayıklama için: her komutu logla
set -x

# Hata durumunda durma (set -e yerine manuel kontrol)
# set -e

echo "🚀 Xcode Cloud Build Script başlatılıyor..."
echo "📂 Mevcut dizin: $(pwd)"
echo "📂 CI_WORKSPACE: ${CI_WORKSPACE:-tanımsız}"
echo "📂 CI_PROJECT_DIR: ${CI_PROJECT_DIR:-tanımsız}"

# Script'in çalıştığı dizini bul
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo "📂 Script dizini: $SCRIPT_DIR"

# Frontend/ios dizinini bul
if [ -d "$SCRIPT_DIR/../frontend/ios" ]; then
    IOS_DIR="$SCRIPT_DIR/../frontend/ios"
    echo "✅ iOS dizini bulundu: $IOS_DIR"
    cd "$IOS_DIR"
elif [ -d "frontend/ios" ]; then
    cd frontend/ios
    echo "✅ Frontend/ios dizini bulundu"
elif [ -f "frontend/ios/Podfile" ]; then
    cd frontend/ios
    echo "✅ Frontend/ios dizini bulundu"
elif [ -f "Podfile" ]; then
    echo "✅ Podfile mevcut dizinde bulundu"
else
    # CI_WORKSPACE kullanarak kök dizine git
    if [ -n "$CI_WORKSPACE" ]; then
        echo "📂 CI_WORKSPACE kullanılarak kök dizine gidiliyor: $CI_WORKSPACE"
        cd "$CI_WORKSPACE"
    fi
    
    # Frontend dizinine git
    if [ -d "frontend/ios" ]; then
        cd frontend/ios
        echo "✅ Frontend/ios dizini bulundu"
    elif [ -d "frontend" ] && [ -f "frontend/ios/Podfile" ]; then
        cd frontend/ios
        echo "✅ Frontend/ios dizini bulundu"
    elif [ -f "Podfile" ]; then
        echo "✅ Podfile mevcut dizinde bulundu"
    else
        echo "❌ Podfile bulunamadı!"
        echo "📂 Mevcut dizin içeriği:"
        ls -la
        exit 1
    fi
fi

# Son kontrol: Podfile'ın varlığını doğrula
if [ ! -f "Podfile" ]; then
    echo "❌ Podfile bulunamadı! Mevcut dizin: $(pwd)"
    echo "📂 Dizin içeriği:"
    ls -la
    exit 1
fi

echo "✅ Podfile bulundu: $(pwd)/Podfile"

# Node.js versiyonunu kontrol et
echo "🔍 Node.js kontrol ediliyor..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js bulundu: $NODE_VERSION"
else
    echo "❌ Node.js bulunamadı!"
    echo "📂 PATH: $PATH"
    exit 1
fi

# npm versiyonunu kontrol et
echo "🔍 npm kontrol ediliyor..."
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm bulundu: $NPM_VERSION"
else
    echo "❌ npm bulunamadı!"
    echo "📂 PATH: $PATH"
    exit 1
fi

# Frontend dizinine git (package.json için)
FRONTEND_DIR="$(pwd)"
if [ -d "../package.json" ] || [ -f "../package.json" ]; then
    cd ..
    FRONTEND_DIR="$(pwd)"
    echo "✅ Frontend dizini: $FRONTEND_DIR"
elif [ -f "package.json" ]; then
    echo "✅ package.json mevcut dizinde bulundu"
else
    echo "⚠️  package.json bulunamadı, Node.js bağımlılıkları atlanıyor"
    FRONTEND_DIR=""
fi

# Node.js bağımlılıklarını yükle (eğer package.json varsa)
if [ -n "$FRONTEND_DIR" ] && [ -f "$FRONTEND_DIR/package.json" ]; then
    cd "$FRONTEND_DIR"
    echo "📦 Node.js bağımlılıkları yükleniyor..."
    echo "📂 Çalışma dizini: $(pwd)"
    
    if [ -f "package-lock.json" ]; then
        echo "📦 npm ci çalıştırılıyor..."
        if npm ci; then
            echo "✅ Node.js bağımlılıkları yüklendi (npm ci)"
        else
            echo "⚠️  npm ci başarısız, npm install deneniyor..."
            npm install || {
                echo "❌ npm install başarısız!"
                exit 1
            }
        fi
    else
        echo "📦 npm install çalıştırılıyor..."
        npm install || {
            echo "❌ npm install başarısız!"
            exit 1
        }
    fi
    echo "✅ Node.js bağımlılıkları yüklendi"
else
    echo "⚠️  package.json bulunamadı, Node.js bağımlılıkları atlanıyor"
fi

# iOS dizinine geri dön
if [ -d "$FRONTEND_DIR/ios" ]; then
    cd "$FRONTEND_DIR/ios"
elif [ -f "Podfile" ]; then
    # Zaten iOS dizinindeyiz
    :
else
    echo "❌ iOS dizini bulunamadı!"
    exit 1
fi

echo "📂 iOS dizini: $(pwd)"

# CocoaPods versiyonunu kontrol et
echo "🔍 CocoaPods kontrol ediliyor..."
if command -v pod &> /dev/null; then
    POD_VERSION=$(pod --version)
    echo "✅ CocoaPods bulundu: $POD_VERSION"
else
    echo "❌ CocoaPods bulunamadı!"
    echo "📂 PATH: $PATH"
    echo "⚠️  Xcode Cloud'da CocoaPods genellikle önceden yüklüdür."
    exit 1
fi

# CocoaPods bağımlılıklarını yükle
echo "📦 CocoaPods bağımlılıkları yükleniyor..."
echo "📂 Çalışma dizini: $(pwd)"
echo "📂 Podfile konumu: $(pwd)/Podfile"

# Pod install çalıştır
if pod install --repo-update; then
    echo "✅ CocoaPods bağımlılıkları yüklendi"
else
    echo "❌ pod install başarısız!"
    echo "📂 Dizin içeriği:"
    ls -la
    exit 1
fi

# Pods klasörünün oluşturulduğunu kontrol et
if [ -d "Pods" ]; then
    echo "✅ Pods klasörü başarıyla oluşturuldu"
    
    # xcconfig dosyasının varlığını kontrol et
    XCCONFIG_FILE="Pods/Target Support Files/Pods-TenisApp/Pods-TenisApp.release.xcconfig"
    if [ -f "$XCCONFIG_FILE" ]; then
        echo "✅ $XCCONFIG_FILE dosyası bulundu"
    else
        echo "⚠️  $XCCONFIG_FILE dosyası bulunamadı"
        echo "📂 Pods/Target Support Files içeriği:"
        ls -la "Pods/Target Support Files/" 2>/dev/null || echo "Klasör bulunamadı"
        echo "⚠️  Build devam edebilir, ancak xcconfig dosyası eksik olabilir"
    fi
else
    echo "❌ Pods klasörü oluşturulamadı!"
    echo "📂 Dizin içeriği:"
    ls -la
    exit 1
fi

echo "🎉 Build hazırlığı tamamlandı!"
