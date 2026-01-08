#!/bin/bash

# UFW Durum Kontrolü ve Devre Dışı Bırakma Scripti

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 UFW (Güvenlik Duvarı) Durum Kontrolü"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# UFW durumunu kontrol et
echo "📊 Mevcut UFW Durumu:"
sudo ufw status verbose
echo ""

# UFW aktif mi kontrol et
if sudo ufw status | grep -q "Status: active"; then
    echo "⚠️  UFW AKTİF - Devre dışı bırakılacak..."
    echo ""
    read -p "UFW'yi devre dışı bırakmak istiyor musunuz? (y/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🛑 UFW devre dışı bırakılıyor..."
        sudo ufw disable
        echo "✅ UFW devre dışı bırakıldı"
        echo ""
        echo "📊 Yeni UFW Durumu:"
        sudo ufw status
    else
        echo "❌ İşlem iptal edildi"
    fi
else
    echo "✅ UFW zaten devre dışı"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 Port Kontrolü"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Port 3000'in dinlenip dinlenmediğini kontrol et
echo "🔍 Port 3000 kontrol ediliyor..."
if sudo netstat -tuln | grep -q ":3000"; then
    echo "✅ Port 3000 dinleniyor"
    echo ""
    echo "📋 Port 3000'i dinleyen süreçler:"
    sudo netstat -tulnp | grep ":3000"
elif sudo ss -tuln | grep -q ":3000"; then
    echo "✅ Port 3000 dinleniyor (ss komutu ile)"
    echo ""
    echo "📋 Port 3000'i dinleyen süreçler:"
    sudo ss -tulnp | grep ":3000"
else
    echo "⚠️  Port 3000 dinlenmiyor"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🐳 Docker Container Durumu"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Docker container'larını kontrol et
if command -v docker &> /dev/null; then
    echo "📋 Çalışan container'lar:"
    docker ps
    echo ""
    echo "📋 Backend container logları (son 20 satır):"
    docker logs --tail 20 tenis-app-backend 2>/dev/null || echo "⚠️  Backend container bulunamadı veya çalışmıyor"
else
    echo "⚠️  Docker yüklü değil"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"


