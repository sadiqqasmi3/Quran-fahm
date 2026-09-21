import { fileURLToPath } from "node:url";
import { createPrismaRepository, MemoryRepository } from "@quran-feham/database";
import { config as loadEnvironmentFile } from "dotenv";
import { buildApp } from "./app.js";
import { loadConfig } from "./config.js";
import { startKhatmReminderWorker } from "./khatm-reminder-worker.js";
import { createRuntimeAuthMailer } from "./mailer.js";

loadEnvironmentFile({ path: fileURLToPath(new URL("../../../.env", import.meta.url)) });

const config = loadConfig();
const prismaHandle = config.databaseUrl ? createPrismaRepository(config.databaseUrl) : undefined;
if (config.environment === "production" && !prismaHandle) {
  throw new Error("Production API cannot start without DATABASE_URL");
}
const mailer = createRuntimeAuthMailer(config);
try {
  await mailer.verify?.();
} catch (error) {
  console.warn("SMTP verification warning (continuing server startup):", error);
}

const repository = prismaHandle?.repository ?? new MemoryRepository();

const app = await buildApp({
  config,
  repository,
  mailer,
  logger: true,
});

const stopReminderWorker = startKhatmReminderWorker({
  repository,
  mailer,
  intervalMs: 60_000,
});

const shutdown = async () => {
  stopReminderWorker();
  await app.close();
  mailer.close?.();
  await prismaHandle?.close();
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

await app.listen({ host: config.host, port: config.port });
