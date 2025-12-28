#!/bin/bash
# iOS IPA Build Script for Xcode Cloud / Local Testing

set -e

# Encoding ayarı
export LANG=en_US.UTF-8

echo "🚀 iOS IPA Build başlatılıyor..."

# Dizinleri ayarla
IOS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$IOS_DIR"
cd "$PROJECT_DIR"

# Pods kontrolü
if [ ! -d "Pods" ]; then
  echo "📦 Pods yükleniyor..."
  pod install
fi

# Build dizinini oluştur
BUILD_DIR="$PROJECT_DIR/build"
mkdir -p "$BUILD_DIR"

# Clean build
echo "🧹 Clean build yapılıyor..."
xcodebuild clean \
  -workspace TenisApp.xcworkspace \
  -scheme TenisApp \
  -configuration Release \
  -quiet

# Archive oluştur
echo "📦 Archive oluşturuluyor..."
ARCHIVE_PATH="$BUILD_DIR/TenisApp.xcarchive"

xcodebuild archive \
  -workspace TenisApp.xcworkspace \
  -scheme TenisApp \
  -configuration Release \
  -archivePath "$ARCHIVE_PATH" \
  -destination "generic/platform=iOS" \
  CODE_SIGN_STYLE=Automatic \
  DEVELOPMENT_TEAM=582M6KD8PF \
  PROVISIONING_PROFILE_SPECIFIER="" \
  ONLY_ACTIVE_ARCH=NO \
  -quiet

if [ ! -d "$ARCHIVE_PATH" ]; then
  echo "❌ Archive oluşturulamadı!"
  exit 1
fi

echo "✅ Archive oluşturuldu: $ARCHIVE_PATH"

# IPA export
echo "📤 IPA export ediliyor..."
EXPORT_PATH="$BUILD_DIR/ipa"
EXPORT_OPTIONS="$PROJECT_DIR/ExportOptions.plist"

# ExportOptions.plist kontrolü
if [ ! -f "$EXPORT_OPTIONS" ]; then
  echo "❌ ExportOptions.plist bulunamadı: $EXPORT_OPTIONS"
  exit 1
fi

xcodebuild -exportArchive \
  -archivePath "$ARCHIVE_PATH" \
  -exportOptionsPlist "$EXPORT_OPTIONS" \
  -exportPath "$EXPORT_PATH" \
  -quiet

# IPA dosyasını bul
IPA_FILE=$(find "$EXPORT_PATH" -name "*.ipa" | head -1)

if [ -z "$IPA_FILE" ]; then
  echo "❌ IPA dosyası oluşturulamadı!"
  exit 1
fi

# IPA'yı build dizinine kopyala
FINAL_IPA="$BUILD_DIR/TenisApp.ipa"
cp "$IPA_FILE" "$FINAL_IPA"

# Dosya boyutunu göster
IPA_SIZE=$(du -h "$FINAL_IPA" | cut -f1)

echo ""
echo "✅ IPA başarıyla oluşturuldu!"
echo "📦 IPA Dosyası: $FINAL_IPA"
echo "📏 Boyut: $IPA_SIZE"
echo ""
echo "📤 Xcode Cloud için:"
echo "   - IPA dosyası hazır: $FINAL_IPA"
echo "   - Xcode Cloud otomatik olarak IPA oluşturup App Store Connect'e yükleyecek"
echo ""
echo "🧪 Test için:"
echo "   - IPA'yı TestFlight'a yükleyebilirsiniz"
echo "   - Veya Xcode → Window → Devices and Simulators ile cihaza yükleyebilirsiniz"
