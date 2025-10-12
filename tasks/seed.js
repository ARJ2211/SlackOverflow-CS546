import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import seedProfessors from "./seed_professors.js";
import { createVectorIndex } from "./seed_vector_index.js";

try {
    const db = await dbConnection();
    await db.dropDatabase();

    console.log("Seeding professors");
    const count = await seedProfessors();
    console.log(`Seeding professors complete! seeded ${count} records`);

    await db.createCollection("questions").catch(() => {});

    console.log("Creating the vector index");
    await createVectorIndex();
    console.log("Creating the vector index completed!");
} catch (e) {
    console.error("Seed failed:", e);
} finally {
    console.log("Closing db connection");
    await closeConnection();
}
