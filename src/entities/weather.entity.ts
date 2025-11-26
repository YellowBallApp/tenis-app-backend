import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('weather_cache')
export class WeatherCache {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  location: string; // Örn: "izmir" veya koordinatlar

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7 })
  longitude: number;

  @Column({ type: 'jsonb' })
  dailyForecast: {
    date: string; // YYYY-MM-DD
    weatherCode: number;
    temperatureMax: number;
    temperatureMin: number;
    precipitationSum: number;
    hourlyData?: Array<{
      time: string; // HH:mm
      temperature: number;
      weatherCode: number;
      precipitation: number;
      windSpeed: number;
    }>;
  }[];

  @Column({ type: 'timestamp' })
  forecastStartDate: Date; // Tahminin başlangıç tarihi

  @Column({ type: 'timestamp' })
  forecastEndDate: Date; // Tahminin bitiş tarihi

  @Column({ type: 'timestamp' })
  lastUpdated: Date; // Son güncelleme zamanı

  @Column({ type: 'timestamp' })
  expiresAt: Date; // Cache'in geçerlilik süresi

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

