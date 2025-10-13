import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import { AppDataSource } from "./config/data-source";
import { swaggerSpec } from "./config/swagger";
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import leagueRoutes from "./routes/league.routes";

const app = express();

dotenv.config();

app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:3000', 'http://192.168.1.108:3000', 'http://192.168.1.108:8081'],
  credentials: true
}));
app.use(express.json());

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

const authMiddleware = express.Router();

/* Yukarıdaki auth middleware daha sonraki routeslar için kullanılacak */

// app.use("/api/user", authMiddleware, userRoutes);


const PORT = process.env.PORT;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connection successful");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.error(" Database connection error:", error));