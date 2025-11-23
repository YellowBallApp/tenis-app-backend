# Ngrok Kullanım Kılavuzu

## 1. Ngrok Hesabı Oluşturun (İlk Kez Kullanıyorsanız)

1. https://ngrok.com adresine gidin
2. Ücretsiz hesap oluşturun (Sign up)
3. Dashboard'a giriş yapın
4. "Your Authtoken" bölümünden token'ınızı kopyalayın

## 2. Ngrok'u Yapılandırın

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN_BURAYA
```

## 3. Backend'i Başlatın

```bash
cd /Users/bariscandemirel/Desktop/tenis_app
npm run start:backend
```

## 4. Yeni Terminal'de Ngrok Tunnel Oluşturun

Yeni bir terminal penceresi açın ve:

```bash
ngrok http 3000
```

Bu komut size bir public URL verecek, örneğin:
```
Forwarding  https://abc123-def456.ngrok-free.app -> http://localhost:3000
```

## 5. Frontend'de API URL'ini Güncelleyin

`frontend/src/services/api.ts` dosyasını açın ve `NGROK_URL` değişkenini güncelleyin:

```typescript
const NGROK_URL = 'https://abc123-def456.ngrok-free.app'; // Ngrok URL'nizi buraya yapıştırın
```

## 6. Frontend'i Yeniden Başlatın

```bash
cd frontend
npx expo start
```

## 7. QR Kodu Paylaşın

Artık arkadaşınız farklı bir internet ağında olsa bile QR kodu tarayarak uygulamaya erişebilir!

## Önemli Notlar

⚠️ **Ngrok Free Plan:**
- Her `ngrok http 3000` komutunu çalıştırdığınızda farklı bir URL alırsınız
- URL değiştiğinde `api.ts` dosyasındaki `NGROK_URL`'yi güncellemeniz gerekir
- Ücretsiz plan sınırlı trafik/bağlantı sayısına sahip

✅ **Sabit Domain İçin:**
- Ngrok'un ücretli planını kullanarak sabit domain alabilirsiniz
- Veya backend'i cloud'a deploy edebilirsiniz (Railway, Render, Heroku)

## Hızlı Komutlar

```bash
# Ngrok tunnel başlat
ngrok http 3000

# Ngrok tunnel durdur
# Terminal'de Ctrl+C yapın
```

## Alternatif: Cloudflare Tunnel (Ücretsiz, Daha İyi)

Eğer ngrok size uymazsa, Cloudflare Tunnel kullanabilirsiniz:

```bash
# Cloudflare Tunnel kur
brew install cloudflare/cloudflare/cloudflared

# Tunnel başlat
cloudflared tunnel --url http://localhost:3000
```

Cloudflare Tunnel daha hızlı ve ücretsiz planında daha fazla özellik sunar.

