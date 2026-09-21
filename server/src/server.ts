import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { connectDatabase } from "./config/database.js";
import { syncElectionStatuses } from "./utils/electionWindow.js";

const PORT = Number(process.env.PORT) || 5000;

async function bootstrap() {
  try {
    await connectDatabase();
    await syncElectionStatuses();

    // Keeps the displayed election status current. Vote submission has its own
    // deadline check, so no vote can be accepted between scheduler runs.
    const statusSync = setInterval(() => {
      void syncElectionStatuses().catch((error) => {
        console.error("Failed to synchronize election statuses:", error);
      });
    }, 15_000);
    statusSync.unref();

    app.listen(PORT, () => {
      console.log(`CPSU E-Voting API running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

bootstrap();
