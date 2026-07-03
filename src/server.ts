import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma-client";

let shuttingDown = false;

async function startServer(): Promise<void> {
  try {
    // Connect to the database
    await prisma.$connect();
    console.log(" Connected to PostgreSQL through Prisma.");

    // Start the Express server
    const server = app.listen(env.port, () => {
      const baseUrl = env.appBaseUrl.replace(/\/$/, "");

      console.log(` Server is running on port ${env.port}`);
      console.log(` API Base URL: ${baseUrl}`);
    });

    // Handle server startup errors
    server.on("error", async (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(
          `❌ Port ${env.port} is already in use. Update PORT in .env and retry.`
        );
      } else {
        console.error("❌ Server failed to start:", error);
      }

      await disconnectDatabase();
      process.exit(1);
    });

    // Graceful shutdown
    const shutdown = (signal: string): void => {
      if (shuttingDown) {
        console.log(" Shutdown already in progress...");
        return;
      }

      shuttingDown = true;

      console.log(` Received ${signal}. Shutting down gracefully...`);

      server.close(() => {
        void disconnectDatabase().finally(() => {
          process.exit(0);
        });
      });
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));

  } catch (error) {
    console.error(" Failed to start server:", error);

    await disconnectDatabase();
    process.exit(1);
  }
}

// Disconnect from the database safely.
async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log(" Database disconnected.");
  } catch (error) {
    console.error(" Error while disconnecting Prisma:", error);
  }
}

void startServer();