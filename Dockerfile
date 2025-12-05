FROM node:22.15.0-alpine

# Production için gerekli sistem paketleri
# Canvas runtime için gerekli kütüphaneler
RUN apk add --no-cache \
    dumb-init \
    cairo \
    jpeg \
    pango \
    giflib \
    pixman \
    libpng \
    && rm -rf /var/cache/apk/*

# Canvas build için geçici olarak build tools ekle
RUN apk add --no-cache --virtual .build-deps \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    libpng-dev \
    pkgconfig

# Non-root kullanıcı oluştur (güvenlik için)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Çalışma dizinini ayarla
WORKDIR /app

# Package dosyalarını kopyala
COPY package*.json ./
COPY tsconfig.json ./

# Tüm bağımlılıkları yükle (dev dependencies dahil - build için gerekli)
RUN npm ci

# Kaynak kodları kopyala
COPY src ./src

# TypeScript'i derle
RUN npm run build

# Sadece production bağımlılıklarını yükle (dev dependencies'leri kaldır)
RUN npm prune --production && \
    npm cache clean --force

# Build tools'ları kaldır (runtime için gerekli değil)
RUN apk del .build-deps

# /app klasörünün yazma izinlerini ayarla (seed flag dosyası için)
RUN chown -R nodejs:nodejs /app

# Kullanıcıyı değiştir
USER nodejs

# Port'u expose et
EXPOSE 3000

# Environment variable'ları ayarla
ENV NODE_ENV=production
ENV PORT=3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Uygulamayı başlat
CMD ["node", "dist/index.js"]
