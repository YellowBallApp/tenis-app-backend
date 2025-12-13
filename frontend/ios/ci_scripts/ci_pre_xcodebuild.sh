#!/bin/bash

# Xcode Cloud pre-build script
# Bu script, Xcode Cloud build'inden önce çalışır ve code signing ayarlarını düzeltir

set -e

echo "🔧 Xcode Cloud pre-build script başlatılıyor..."

# Release configuration için CODE_SIGN_IDENTITY parametresini kaldır
# Xcode Cloud bazen CODE_SIGN_IDENTITY=- parametresi ekliyor, bu TestFlight için yanlış
# Otomatik signing kullanıldığında bu parametreyi kaldırmalıyız

# Build environment variables'ı kontrol et
if [ -n "$CI_XCODEBUILD_ACTION" ]; then
    echo "📦 Xcode Cloud build environment detected"
    
    # CODE_SIGN_IDENTITY environment variable'ını temizle
    unset CODE_SIGN_IDENTITY
    
    # AD_HOC_CODE_SIGNING_ALLOWED'ı kaldır (TestFlight için gerekli değil)
    unset AD_HOC_CODE_SIGNING_ALLOWED
    
    echo "✅ Code signing environment variables temizlendi"
    echo "✅ Otomatik signing kullanılacak (CODE_SIGN_STYLE=Automatic)"
fi

echo "✅ Pre-build script tamamlandı"
