import { AppDataSource } from "../config/data-source";
import { seedUsers } from "./user.seed";
import { seedLeagues } from "./league.seed";
import { seedLeagueStandings } from "./leagueStandings.seed";
import { seedMatches } from "./match.seed";
import { seedReservations } from "./reservation.seed";
import { seedAnnouncements } from "./announcement.seed";
import { seedComments } from "./comment.seed";
import { seedCoaches } from "./coach.seed";
import { seedCourts } from "./court.seed";
import { seedEloHistory } from "./eloHistory.seed";

export async function runSeeds() {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
        console.log("🗄️  Seed prosesi başladı...\n");
        await queryRunner.connect();
        await queryRunner.startTransaction();

        await seedUsers();
        await seedCourts();
        await seedLeagues();
        await seedLeagueStandings();
        await seedMatches();
        await seedEloHistory(); // ELO geçmişi
        await seedReservations();
        await seedAnnouncements();
        await seedComments();
        await seedCoaches();

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
