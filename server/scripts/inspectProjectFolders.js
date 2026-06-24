// READ-ONLY: prints each project's customFolders and a summary of its documents
// so we can see the shape of the seeded "dummy folder" entries before cleaning.
import "dotenv/config";
import { supabase } from "../db/supabase.js";

async function run() {
  const { data, error } = await supabase
    .from("projects")
    .select("id, doc, created_at")
    .order("created_at", { ascending: true });
  if (error) throw error;

  console.log(`Found ${data.length} project(s).\n`);

  let withFolders = 0;
  for (const row of data) {
    const doc = row.doc || {};
    const documents = Array.isArray(doc.documents) ? doc.documents : [];
    const customFolders = Array.isArray(doc.customFolders) ? doc.customFolders : [];
    if (!documents.length && !customFolders.length) continue;
    withFolders += 1;

    console.log(`▸ "${doc.name || doc.projectName || row.id}"  (id ${row.id})`);
    console.log(`   customFolders: ${JSON.stringify(customFolders)}`);
    console.log(`   documents: ${documents.length}`);
    for (const d of documents) {
      const hasFile = Boolean(d.fileUrl || d.storageUrl || d.url);
      console.log(
        `     - name=${JSON.stringify(d.name || d.fileName)} category=${JSON.stringify(d.category)} ` +
        `type=${JSON.stringify(d.type)} hasFile=${hasFile}` +
        (d.tags ? ` tags=${JSON.stringify(d.tags)}` : "")
      );
    }
    console.log("");
  }

  console.log(`\n${withFolders} project(s) have any documents/customFolders.`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
