import { AppDataSource } from "../config/data-source";

async function runMigrations() {
  try {
    console.log("📦 Migration'lar başlatılıyor...");
    
    await AppDataSource.initialize();
    console.log("✅ Veritabanı bağlantısı başarılı");

    const migrations = await AppDataSource.runMigrations();
    
    if (migrations.length > 0) {
      console.log(`✅ ${migrations.length} migration başarıyla çalıştırıldı:`);
      migrations.forEach((migration) => {
        console.log(`   - ${migration.name}`);
      });
    } else {
      console.log("ℹ️  Çalıştırılacak yeni migration yok");
    }

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration hatası:", error);
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
    process.exit(1);
  }
}

runMigrations();



