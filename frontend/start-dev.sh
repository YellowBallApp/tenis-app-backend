#!/bin/bash

# Tenis App Development Server Başlatma Scripti

echo "🎾 Tenis App Development Server Başlatılıyor..."
echo ""
echo "📱 QR kodu telefonunuzdan Expo Go ile tarayın!"
echo ""
echo "⚠️  ÖNEMLİ:"
echo "   - Telefon ve bilgisayar aynı WiFi'de olmalı"
echo "   - Backend'in çalıştığından emin olun (localhost:3000)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

cd /Users/bariscandemirel/Desktop/tenis_app/frontend

# Cache temizle ve başlat
npx expo start --clear

