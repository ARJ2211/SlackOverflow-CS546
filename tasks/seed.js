import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import seedProfessors from "./seed_professors.js";

const db = await dbConnection();
await db.dropDatabase();

console.log("Seeding professors");
await seedProfessors();

await closeConnection();
