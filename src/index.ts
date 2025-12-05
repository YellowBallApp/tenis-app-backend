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
import reservationRoutes from "./routes/reservation.routes";
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
import weatherRoutes from "./routes/weather.routes";
import adminRoutes from "./routes/admin.routes";
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
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Development modunda tüm local network IP'lerine izin ver
    if (process.env.NODE_ENV !== 'production') {
      // Origin yoksa (Postman, mobile app gibi) izin ver
      if (!origin) {
        return callback(null, true);
      }
      
      // Localhost'a izin ver (tüm portlar dahil - admin panel için)
      if (origin && (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      
      // Local network IP'lerine izin ver (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
      const localNetworkRegex = /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2[0-9]|3[01])\.\d+\.\d+)(:\d+)?$/;
      if (localNetworkRegex.test(origin)) {
        return callback(null, true);
      }
      
      // Ngrok URL'lerine izin ver
      if (origin && (origin.includes('ngrok') || origin.includes('ngrok-free') || origin.includes('ngrok.io'))) {
        return callback(null, true);
      }
      
      // Expo Go ve development için tüm isteklere izin ver
      return callback(null, true);
    }
    
    // Production için sadece belirli origin'lere izin ver
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:3000',
      'http://localhost:5173', // Admin panel
      'http://127.0.0.1:5173', // Admin panel
    ];
    
    if (origin && allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
  const localIP = getLocalNetworkIP();
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
app.use("/api/reservations", reservationRoutes);
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
app.use("/api/weather", weatherRoutes);
app.use("/api/admin", adminRoutes);

// Error handler middleware (tüm route'lardan sonra)
app.use(errorHandler);

const authMiddleware = express.Router();

/* Yukarıdaki auth middleware daha sonraki routeslar için kullanılacak */

// app.use("/api/user", authMiddleware, userRoutes);


const PORT = parseInt(process.env.PORT || '3000', 10);

AppDataSource.initialize()
  .then(async () => {
    console.log("Database connection successful");
    
    // Veritabanında tabloların var olup olmadığını ve içinde veri olup olmadığını kontrol et
    const queryRunner = AppDataSource.createQueryRunner();
    try {
      await queryRunner.connect();
      const hasTables = await queryRunner.hasTable("user");
      let hasData = false;
      
      if (hasTables) {
        // Tablo varsa içinde veri olup olmadığını kontrol et
        const result = await queryRunner.query('SELECT COUNT(*) as count FROM "user"');
        hasData = parseInt(result[0].count) > 0;
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
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Mobile access: http://${localIP}:${PORT}`);
      console.log(`💻 Local access: http://localhost:${PORT}`);
      console.log(`🌐 API endpoint: http://${localIP}:${PORT}/api`);
    });
  })
  .catch((error) => console.error(" Database connection error:", error));

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⚠️  Sunucu kapatılıyor...");
  stopAllCronJobs();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⚠️  Sunucu kapatılıyor...");
  stopAllCronJobs();
  process.exit(0);
});