// Supabase version of cleanProjectFolders.js.
// Removes the seeded "dummy folder" entries from every project:
//   - documents: drops entries with type === "folder" (placeholder folders)
//   - customFolders: keeps only string names (drops seeded folder OBJECTS)
// Real document records (uploaded files / metadata) are left untouched.
import "dotenv/config";
import { supabase } from "../db/supabase.js";

async function run() {
  const { data, error } = await supabase.from("projects").select("id, doc");
  if (error) throw error;

  let updated = 0;
  for (const row of data) {
    const doc = row.doc || {};
    const documents = Array.isArray(doc.documents) ? doc.documents : [];
    const customFolders = Array.isArray(doc.customFolders) ? doc.customFolders : [];

    const cleanedDocuments = documents.filter((d) => d && d.type !== "folder");
    const cleanedCustomFolders = customFolders.filter((name) => typeof name === "string");

    if (
      cleanedDocuments.length !== documents.length ||
      cleanedCustomFolders.length !== customFolders.length
    ) {
      const nextDoc = { ...doc, documents: cleanedDocuments, customFolders: cleanedCustomFolders };
      const { error: upErr } = await supabase
        .from("projects")
        .update({ doc: nextDoc, updated_at: new Date().toISOString() })
        .eq("id", row.id);
      if (upErr) throw upErr;
      updated += 1;
      console.log(
        `Cleaned "${doc.name || row.id}": removed ${documents.length - cleanedDocuments.length} folder doc(s), ` +
        `${customFolders.length - cleanedCustomFolders.length} folder object(s)`
      );
    }
  }

  console.log(`\nDone. ${updated} of ${data.length} project(s) updated.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
