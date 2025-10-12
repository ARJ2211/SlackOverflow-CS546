import { dbConnection, closeConnection } from "../config/mongoConnection.js";
import seedProfessors from "./seed_professors.js";

const db = await dbConnection();
await db.dropDatabase();

console.log("Seeding professors");
const seeds = await seedProfessors();
console.log(`Seeding professors complete!, seeded ${seeds} data`);

console.log("Closing db connection");
await closeConnection();
