import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const projects = await db.collection("projects").find({}).toArray();

  let updated = 0;
  for (const project of projects) {
    const documents = Array.isArray(project.documents) ? project.documents : [];
    const customFolders = Array.isArray(project.customFolders) ? project.customFolders : [];

    const cleanedDocuments = documents.filter((doc) => doc && doc.type !== "folder");
    const cleanedCustomFolders = customFolders.filter((name) => typeof name === "string");

    if (cleanedDocuments.length !== documents.length || cleanedCustomFolders.length !== customFolders.length) {
      await db.collection("projects").updateOne(
        { _id: project._id },
        { $set: { documents: cleanedDocuments, customFolders: cleanedCustomFolders } }
      );
      updated += 1;
      console.log(`Cleaned "${project.name}": removed ${documents.length - cleanedDocuments.length} fake folder doc(s)`);
    }
  }

  console.log(`\nDone. ${updated} of ${projects.length} project(s) updated.`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
