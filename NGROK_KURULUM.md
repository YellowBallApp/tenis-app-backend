# Ngrok ile Public Tunnel Oluşturma

## Ngrok Nedir?

Ngrok, local sunucunuzu internet üzerinden erişilebilir hale getiren bir tunnel servisidir. Böylece farklı internet ağlarındaki cihazlar da backend'inize bağlanabilir.

## Kurulum

### 1. Ngrok'u İndirin ve Kurun

```bash
# Homebrew ile (önerilen)
brew install ngrok/ngrok/ngrok

# Veya manuel olarak
# https://ngrok.com/download adresinden indirin
```

### 2. Ngrok Hesabı Oluşturun

1. https://ngrok.com adresine gidin
2. Ücretsiz hesap oluşturun
3. Dashboard'dan authtoken'ınızı kopyalayın

### 3. Ngrok'u Yapılandırın

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## Kullanım

### Backend'i Başlatın

```bash
cd /Users/bariscandemirel/Desktop/tenis_app
npm run start:backend
```

### Ngrok Tunnel Oluşturun

Yeni bir terminal penceresi açın ve:

```bash
ngrok http 3000
```

Bu komut size bir public URL verecek, örneğin:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

### Frontend'de API URL'ini Güncelleyin

`frontend/src/services/api.ts` dosyasında:

```typescript
const getApiBaseUrl = () => {
  if (__DEV__) {
    // Ngrok URL'sini buraya yapıştırın
    return 'https://abc123.ngrok-free.app/api'; // Ngrok URL'niz
  }
  return 'https://abc123.ngrok-free.app/api';
};
```

### Backend CORS Ayarlarını Güncelleyin

`src/index.ts` dosyasında ngrok URL'sini ekleyin veya tüm origin'lere izin verin (development için).

## Önemli Notlar

⚠️ **Ngrok Free Plan Sınırlamaları:**
- Her başlatışta farklı URL alırsınız
- URL'yi her değiştiğinde frontend'i güncellemeniz gerekir
- Ücretsiz plan sınırlı trafik/bağlantı sayısına sahip

✅ **Çözüm:**
- Ngrok'un ücretli planını kullanarak sabit domain alabilirsiniz
- Veya backend'i cloud'a deploy edebilirsiniz (Railway, Render, Heroku, vs.)

## Alternatif Çözümler

### 1. Cloudflare Tunnel (Ücretsiz, Sabit Domain)
```bash
# Cloudflare Tunnel kurulumu
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://localhost:3000
```

### 2. Localtunnel (Ücretsiz)
```bash
npm install -g localtunnel
lt --port 3000
```

### 3. Backend'i Cloud'a Deploy Etme
- **Railway**: https://railway.app (ücretsiz tier var)
- **Render**: https://render.com (ücretsiz tier var)
- **Heroku**: https://heroku.com (ücretli)

