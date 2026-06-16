import "dotenv/config";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";

const port = Number(process.env.PORT ?? 4000);
const mongoUri = process.env.MONGODB_URI ?? process.env.MONGO_URI ?? "";

console.log("MONGODB_URI:", process.env.MONGODB_URI);
async function start() {
  await connectDatabase(mongoUri);
 

  const app = createApp();

  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
