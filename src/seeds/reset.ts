import { AppDataSource } from "../config/data-source";

async function resetDatabase() {
  try {
    await AppDataSource.initialize();
    console.log("🗄️  Veritabanı bağlantısı başarılı");

    // Tüm tabloları temizle
    const entities = AppDataSource.entityMetadatas;

    console.log("🗑️  Tablolar temizleniyor...");
    
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE;`);
      console.log(`   ✅ ${entity.tableName} temizlendi`);
    }

    console.log("\n✅ Tüm tablolar başarıyla temizlendi!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Hata:", error);
    process.exit(1);
  }
}

resetDatabase();

