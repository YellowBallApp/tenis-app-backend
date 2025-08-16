import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./config/data-source";
import authRoutes from "./routes/auth.routes";

const app = express();

dotenv.config();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

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