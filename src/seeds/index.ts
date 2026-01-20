import { AppDataSource } from "../config/data-source";
import { seedUsers } from "./user.seed";
import { seedCourts } from "./court.seed";

export async function runSeeds() {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
        console.log("🗄️  Seed prosesi başladı...\n");
        await queryRunner.connect();
        await queryRunner.startTransaction();

        await seedUsers();
        await seedCourts();

        console.log("\n✅ Seeding completed successfully!");

        await queryRunner.commitTransaction();
        await queryRunner.release();

        // Eğer seed dosyası doğrudan çalıştırılıyorsa process.exit() yap
        if (require.main === module) {
            process.exit(0);
        }

    } catch (error) {
        console.error("❌ Seed error:", error);
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        
        // Eğer seed dosyası doğrudan çalıştırılıyorsa process.exit() yap
        if (require.main === module) {
            process.exit(1);
        } else {
            throw error;
        }
    }
}

// Eğer seed dosyası doğrudan çalıştırılıyorsa (npm run seed:run)
if (require.main === module) {
    AppDataSource.initialize()
        .then(runSeeds)
        .catch((error) => {
            console.log("❌ Database connection error:", error);
            process.exit(1);
        });
}
