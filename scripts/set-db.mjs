// Switch the Prisma datasource provider between local dev and production.
//   node scripts/set-db.mjs postgres   (production / Vercel)
//   node scripts/set-db.mjs sqlite     (local dev)
import { promises as fs } from "fs";

const target = (process.argv[2] || "").toLowerCase();
const map = { sqlite: "sqlite", postgres: "postgresql", postgresql: "postgresql" };
const provider = map[target];
if (!provider) {
  console.error("Usage: node scripts/set-db.mjs <sqlite|postgres>");
  process.exit(1);
}

const path = "prisma/schema.prisma";
const schema = await fs.readFile(path, "utf8");
const updated = schema.replace(
  /provider = "(sqlite|postgresql)"/,
  `provider = "${provider}"`,
);

if (updated === schema) {
  console.log(`Datasource provider already "${provider}" (no change).`);
} else {
  await fs.writeFile(path, updated);
  console.log(`Datasource provider set to "${provider}".`);
  console.log("Now run:  npx prisma generate  &&  npx prisma db push");
}
