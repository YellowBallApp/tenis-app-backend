import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./config/data-source";
import { swaggerSpec } from "./config/swagger";
import { initializeCronJobs, stopAllCronJobs } from "./cron/cronManager";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import leagueRoutes from "./routes/league.routes";
import leagueTemplateRoutes from "./routes/leagueTemplate.routes";
import reservationRoutes from "./routes/reservation.routes";
import reservationTimeSlotRoutes from "./routes/reservationTimeSlot.routes";
import reservationTemplateRoutes from "./routes/reservationTemplate.routes";
import announcementRoutes from "./routes/announcement.routes";
import tournamentRoutes from "./routes/tournament.routes";
import coachRoutes from "./routes/coach.routes";
import matchHistoryRoutes from "./routes/matchHistory.routes";
import courtRoutes from "./routes/court.routes";
import commentRoutes from "./routes/comment.routes";
import notificationRoutes from "./routes/notification.routes";
import matchChallengeRoutes from "./routes/matchChallenge.routes";
import eloRoutes from "./routes/elo.routes";
import cronRoutes from "./routes/cron.routes";
import coachReviewRoutes from "./routes/coachReview.routes";
import memberReviewRoutes from "./routes/memberReview.routes";
import weatherRoutes from "./routes/weather.routes";
import adminRoutes from "./routes/admin.routes";
import leagueApplicationRoutes from "./routes/leagueApplication.routes";
import shieldRoutes from "./routes/shield.routes";
import { getLocalNetworkIP } from "./utils/network";
import { errorHandler } from "./utils/error/app.error";
import { runSeeds } from "./seeds/index";

const app = express();

dotenv.config();

// Güvenlik middleware'leri
app.use(helmet({
  contentSecurityPolicy: false, // Swagger UI için CSP'yi devre dışı bırak
  crossOriginEmbedderPolicy: false,
}));

// Gzip sıkıştırma
app.use(compression());

// Development için esnek CORS ayarları - tüm local network IP'lerine izin ver
const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Authorization'],
  optionsSuccessStatus: 200, // Bazı eski tarayıcılar (IE11) için
};

app.use(cors(corsOptions));

// Body parser limitleri - profil fotoğrafları için yüksek limit
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Tenis App API Docs',
}));

// Ana sayfa - API bilgisi
app.get('/', (req, res) => {
  res.json({
    message: 'Tenis App Backend API',
    version: '1.0.0',
    documentation: '/api-docs',
  });
});

// Server bilgisi endpoint'i - Frontend'in IP'yi dinamik olarak alması için
app.get('/api/server-info', (req, res) => {
  const localIP = process.env.API_URL;
  const PORT = parseInt(process.env.PORT || '3000', 10);
  
  res.json({
    success: true,
    data: {
      ip: localIP,
      port: PORT,
      apiUrl: `http://${localIP}:${PORT}/api`,
      baseUrl: `http://${localIP}:${PORT}`,
    },
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/league", leagueRoutes);
app.use("/api/league-template", leagueTemplateRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reservation-time-slots", reservationTimeSlotRoutes);
app.use("/api/reservation-templates", reservationTemplateRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/tournaments", tournamentRoutes);
app.use("/api/coaches", coachRoutes);
app.use("/api/match-history", matchHistoryRoutes);
app.use("/api/courts", courtRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/match-challenges", matchChallengeRoutes);
app.use("/api/elo", eloRoutes);
app.use("/api/cron", cronRoutes);
app.use("/api/coach-reviews", coachReviewRoutes);
app.use("/api/member-reviews", memberReviewRoutes);
app.use("/api/weather", weatherRoutes);
app.use("/api/league-applications", leagueApplicationRoutes);
app.use("/api/shield", shieldRoutes);
app.use("/api/admin", adminRoutes);

// Error handler middleware (tüm route'lardan sonra)
app.use(errorHandler);

const authMiddleware = express.Router();

/* Yukarıdaki auth middleware daha sonraki routeslar için kullanılacak */

// app.use("/api/user", authMiddleware, userRoutes);


const PORT = parseInt(process.env.PORT || '3000', 10);

// HTTP server instance'ını sakla (graceful shutdown için)
let server: any = null;

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connection successful");
    
    // Veritabanında tabloların var olup olmadığını ve içinde veri olup olmadığını kontrol et
    const queryRunner = AppDataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      
      // Reservation tablosundaki geçersiz userId'leri temizle (foreign key hatalarını önlemek için)
      try {
        const hasReservationTable = await queryRunner.hasTable("reservation");
        const hasUserTable = await queryRunner.hasTable("user");
        if (hasReservationTable && hasUserTable) {
          // Geçersiz userId'lere sahip reservation'ları temizle
          const result = await queryRunner.query(`
            DELETE FROM "reservation" 
            WHERE "userId" IS NOT NULL 
            AND "userId" NOT IN (SELECT id FROM "user")
          `);
          console.log("🧹 Geçersiz reservation kayıtları temizlendi");
        }
      } catch (error) {
        // Reservation tablosu yoksa veya hata varsa devam et
        console.log("ℹ️  Reservation tablosu kontrolü atlandı:", error);
      }
      
      // Synchronize aktifse, tabloların oluşmasını beklemek için retry mekanizması
      let hasTables = false;
      let retries = 0;
      const maxRetries = 15; // 15 saniye maksimum bekleme
      
      while (!hasTables && retries < maxRetries) {
        try {
          hasTables = await queryRunner.hasTable("user");
          if (!hasTables) {
            retries++;
            console.log(`⏳ Tablolar oluşturuluyor... (deneme ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 saniye bekle
          }
        } catch (error) {
          // Tablo henüz oluşmamış, tekrar dene
          retries++;
          if (retries < maxRetries) {
            console.log(`⏳ Tablolar oluşturuluyor... (deneme ${retries}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!hasTables) {
        console.error("❌ Tablolar oluşturulamadı. Synchronize işlemi başarısız olabilir.");
        throw new Error("Tablolar oluşturulamadı");
      }
      
      console.log("✅ Tablolar başarıyla oluşturuldu/kontrol edildi");
      
      let hasData = false;
      
      if (hasTables) {
        // Tablo varsa içinde veri olup olmadığını kontrol et
        try {
          const result = await queryRunner.query('SELECT COUNT(*) as count FROM "user"');
          hasData = parseInt(result[0].count) > 0;
        } catch (error) {
          // Tablo yeni oluşturulmuş, veri yok
          hasData = false;
        }
      }
      
      if (!hasTables || !hasData) {
        if (!hasTables) {
          console.log("📦 Veritabanı tabloları bulunamadı, seed işlemi başlatılıyor...");
        } else {
          console.log("📦 Veritabanı tabloları mevcut ancak veri yok, seed işlemi başlatılıyor...");
        }
        await runSeeds();
        console.log("✅ Seed işlemi tamamlandı, sunucu başlatılıyor...");
      } else {
        console.log("ℹ️  Veritabanı tabloları ve veriler mevcut, seed işlemi atlanıyor...");
      }
    } catch (error) {
      console.error("⚠️  Tablo kontrolü sırasında hata:", error);
      // Hata olsa bile sunucuyu başlat
    } finally {
      // Resource leak'i önlemek için her durumda queryRunner'ı release et
      await queryRunner.release();
    }
    
    // Cron job'ları başlat
    initializeCronJobs();
    
    // 0.0.0.0 ile tüm network interface'lerden erişilebilir yap (mobil test için)
    const localIP = getLocalNetworkIP();
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Mobile access: http://${localIP}:${PORT}`);
      console.log(`💻 Local access: http://localhost:${PORT}`);
      console.log(`🌐 API endpoint: http://${localIP}:${PORT}/api`);
    });
  })
  .catch((error) => console.error(" Database connection error:", error));

// Graceful shutdown fonksiyonu
const gracefulShutdown = async (signal: string) => {
  console.log(`\n⚠️  ${signal} sinyali alındı, sunucu kapatılıyor...`);
  
  // Yeni istekleri kabul etmeyi durdur
  if (server) {
    server.close(() => {
      console.log("✅ HTTP server kapatıldı");
    });
  }
  
  // Cron job'ları durdur
  stopAllCronJobs();
  
  // Database connection'ı kapat (memory leak'i önlemek için kritik!)
  if (AppDataSource.isInitialized) {
    try {
      await AppDataSource.destroy();
      console.log("✅ Database connection kapatıldı");
    } catch (error) {
      console.error("❌ Database connection kapatılırken hata:", error);
    }
  }
  
  // Timeout ile zorla kapat (30 saniye sonra)
  setTimeout(() => {
    console.error("⚠️  Zorla kapatılıyor (timeout)...");
    process.exit(1);
  }, 30000);
  
  // Normal çıkış
  process.exit(0);
};

// Graceful shutdown handler'ları
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// Unhandled rejection ve exception handler'ları (memory leak önleme)
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection:", reason);
  // Production'da logla ama çıkma, development'ta daha detaylı bilgi ver
});

process.on("uncaughtException", (error) => {
  console.error("❌ Uncaught Exception:", error);
  // Kritik hatalarda graceful shutdown yap
  gracefulShutdown("UNCAUGHT_EXCEPTION");
});