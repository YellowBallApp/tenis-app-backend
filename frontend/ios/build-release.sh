#!/bin/bash
# iOS Release Build Script for App Store

set -e

echo "🚀 iOS Release Build başlatılıyor..."

# Dizinleri kontrol et
IOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$IOS_DIR"
WORKSPACE_DIR="$IOS_DIR/.."

cd "$PROJECT_DIR"

# Clean build
echo "🧹 Clean build yapılıyor..."
xcodebuild clean \
  -project TenisApp.xcodeproj \
  -scheme TenisApp \
  -configuration Release

# Archive oluştur
echo "📦 Archive oluşturuluyor..."
ARCHIVE_PATH="$HOME/Library/Developer/Xcode/Archives/$(date +%Y-%m-%d)/TenisApp-$(date +%Y-%m-%d-%H%M%S).xcarchive"

xcodebuild archive \
  -project TenisApp.xcodeproj \
  -scheme TenisApp \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM=582M6KD8PF \
  PROVISIONING_PROFILE_SPECIFIER="" \
  ONLY_ACTIVE_ARCH=NO

echo "✅ Archive oluşturuldu: $ARCHIVE_PATH"
echo ""
echo "📤 App Store Connect'e yüklemek için:"
echo "   1. Xcode'u açın"
echo "   2. Window → Organizer'ı açın"
echo "   3. Archives sekmesinde oluşturulan archive'ı bulun"
echo "   4. 'Distribute App' butonuna tıklayın"
echo "   5. 'App Store Connect' seçin ve adımları takip edin"
echo ""
echo "   VEYA command line ile:"
echo "   xcodebuild -exportArchive \\"
echo "     -archivePath \"$ARCHIVE_PATH\" \\"
echo "     -exportOptionsPlist ExportOptions.plist \\"
echo "     -exportPath ./build"
