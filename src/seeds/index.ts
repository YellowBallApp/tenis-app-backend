import { AppDataSource } from "../config/data-source";
import { seedUsers } from "./user.seed";

async function runSeeds() {
    const queryRunner = AppDataSource.createQueryRunner();

    try {
        console.log("Seed prosesi başladı...");
        await queryRunner.connect();
        await queryRunner.startTransaction();

        await seedUsers();

        console.log("Seeding completed successfully!");

        await queryRunner.commitTransaction();
        await queryRunner.release();

        process.exit(0);

    } catch (error) {
        console.error("Seed error:", error);
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        process.exit(1);
    }
}

AppDataSource.initialize()
    .then(runSeeds)
    .catch((error) => console.log("Database connection error:", error));
