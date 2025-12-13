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

# CocoaPods'u kontrol et
echo "🔧 CocoaPods kontrol ediliyor..."
if ! command -v pod &> /dev/null; then
    echo "⚠️ CocoaPods bulunamadı, yükleniyor..."
    sudo gem install cocoapods
fi

# Pod install çalıştır
echo "📦 Pod install çalıştırılıyor..."
pod install --repo-update

# Pods klasörünün oluşturulduğunu kontrol et
if [ ! -d "Pods" ]; then
    echo "❌ Pods klasörü oluşturulamadı!"
    exit 1
fi

echo "✅ Pods klasörü oluşturuldu"
echo "✅ Post-clone script tamamlandı"
