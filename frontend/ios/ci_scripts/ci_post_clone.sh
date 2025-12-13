#!/bin/bash

# Xcode Cloud post-clone script
# Bu script, repository clone edildikten sonra çalışır ve dependencies'leri yükler

set -e

echo "📦 Xcode Cloud post-clone script başlatılıyor..."

# Xcode Cloud workspace path'ini kontrol et
if [ -n "$CI_WORKSPACE" ]; then
    WORKSPACE_PATH="$CI_WORKSPACE"
elif [ -d "/Volumes/workspace/repository" ]; then
    WORKSPACE_PATH="/Volumes/workspace/repository"
else
    WORKSPACE_PATH="$(pwd)"
fi

echo "📍 Workspace path: $WORKSPACE_PATH"

# iOS dizinine git
IOS_DIR="$WORKSPACE_PATH/frontend/ios"
if [ ! -d "$IOS_DIR" ]; then
    echo "❌ iOS dizini bulunamadı: $IOS_DIR"
    exit 1
fi

cd "$IOS_DIR"
echo "📂 iOS dizinine geçildi: $(pwd)"

# Node.js kontrol et ve yükle
echo "🔧 Node.js kontrol ediliyor..."

# Xcode Cloud'da Node.js genellikle /usr/local/bin veya /opt/homebrew/bin'de olabilir
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js bulunamadı, yükleniyor..."
    
    # Xcode Cloud'da genellikle Homebrew mevcuttur
    if command -v brew &> /dev/null; then
        echo "📦 Homebrew ile Node.js yükleniyor..."
        brew install node
    else
        # Alternatif: nvm kullan
        echo "📦 nvm ile Node.js yükleniyor..."
        export NVM_DIR="$HOME/.nvm"
        if [ -s "$NVM_DIR/nvm.sh" ]; then
            source "$NVM_DIR/nvm.sh"
            nvm install --lts
            nvm use --lts
        else
            # nvm yükle
            curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
            export NVM_DIR="$HOME/.nvm"
            [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"
            nvm install --lts
            nvm use --lts
        fi
    fi
fi

# Node.js versiyonunu kontrol et
echo "✅ Node.js versiyonu: $(node --version)"
echo "✅ npm versiyonu: $(npm --version)"

# Frontend dizinine git ve npm install çalıştır
FRONTEND_DIR="$WORKSPACE_PATH/frontend"
if [ -d "$FRONTEND_DIR" ]; then
    cd "$FRONTEND_DIR"
    echo "📦 Frontend dependencies yükleniyor..."
    if [ -f "package.json" ]; then
        # npm install'ı optimize et (cache kullan, verbose output)
        echo "⏳ npm install başlatılıyor (bu biraz zaman alabilir)..."
        npm install --prefer-offline --no-audit --progress=false 2>&1 | head -100
        echo "✅ Frontend dependencies yüklendi"
    else
        echo "⚠️ package.json bulunamadı, atlanıyor..."
    fi
fi

# iOS dizinine geri dön
cd "$IOS_DIR"

# CocoaPods'u kontrol et
echo "🔧 CocoaPods kontrol ediliyor..."
if ! command -v pod &> /dev/null; then
    echo "⚠️ CocoaPods bulunamadı, yükleniyor..."
    sudo gem install cocoapods
fi

# Pod install çalıştır (optimize edilmiş)
echo "📦 Pod install çalıştırılıyor (bu biraz zaman alabilir)..."
# --repo-update sadece ilk seferde gerekli, sonraki build'lerde gereksiz
# Xcode Cloud'da her build temiz bir ortam olduğu için --repo-update gerekli
# Ancak verbose output'u azaltıyoruz
pod install --repo-update --verbose 2>&1 | grep -E "(Installing|Downloading|Generating|Pod installation)" | head -50

# Pods klasörünün oluşturulduğunu kontrol et
if [ ! -d "Pods" ]; then
    echo "❌ Pods klasörü oluşturulamadı!"
    exit 1
fi

echo "✅ Pods klasörü oluşturuldu"
echo "✅ Post-clone script tamamlandı"
