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

const app = express();

dotenv.config();

// Güvenlik middleware'leri
app.use(helmet({
  contentSecurityPolicy: false, // Swagger UI için CSP'yi devre dışı bırak
  crossOriginEmbedderPolicy: false,
}));

// Gzip sıkıştırma
app.use(compression());

app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'http://192.168.1.108:3000', 'http://192.168.1.108:8081'],
  credentials: true
}));

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

const authMiddleware = express.Router();

/* Yukarıdaki auth middleware daha sonraki routeslar için kullanılacak */

// app.use("/api/user", authMiddleware, userRoutes);


const PORT = parseInt(process.env.PORT || '3000', 10);

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection successful");
    
    // Cron job'ları başlat
    initializeCronJobs();
    
    // 0.0.0.0 ile tüm network interface'lerden erişilebilir yap (mobil test için)
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 Mobile access: http://192.168.1.104:${PORT}`);
      console.log(`💻 Local access: http://localhost:${PORT}`);
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