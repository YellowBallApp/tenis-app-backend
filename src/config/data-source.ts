import "reflect-metadata";
import dotenv from "dotenv";
import { DataSource } from "typeorm";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "postgres",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_DATABASE || "tennis",
  synchronize: process.env.NODE_ENV === "development",
  logging: false,
  entities: ['src/entities/**/*.ts'],
  migrations: ["src/migrations/*.ts"],
  subscribers: [],
  extra: {
    max: Number(process.env.DB_POOL_MAX) || 20,
    min: Number(process.env.DB_POOL_MIN) || 5,
    acquireTimeoutMillis: 30000, // 30 saniye - connection pool'dan bağlantı alma timeout'u
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT) || 10000,
    statement_timeout: 30000, // 30 saniye - SQL sorgu timeout'u
  },
});