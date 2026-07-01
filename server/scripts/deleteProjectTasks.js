/**
 * Delete the legacy "task" records that were attached to a project, now that the
 * project board is driven purely by project stages. These are the leftover plain
 * cards (e.g. "Delivery", "Development", "requirments", "Untitled Stage") that used
 * to be created via the old "Add Task" button.
 *
 * SAFE BY DEFAULT: this only LISTS what it would delete. Pass --confirm to actually
 * delete.
 *
 * Usage (run from the server/ folder, where your .env with MONGO_URI lives):
 *   node scripts/deleteProjectTasks.js <projectId>            # dry run (lists only)
 *   node scripts/deleteProjectTasks.js <projectId> --confirm  # actually deletes
 *   node scripts/deleteProjectTasks.js --all                  # dry run, ALL projects' tasks
 *   node scripts/deleteProjectTasks.js --all --confirm        # deletes ALL project-linked tasks
 */
import "dotenv/config";
import dns from "dns";
import mongoose from "mongoose";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const args = process.argv.slice(2);
const confirm = args.includes("--confirm");
const all = args.includes("--all");
const projectId = args.find((a) => !a.startsWith("--"));

if (!all && !projectId) {
  console.error("Provide a <projectId>, or use --all. Add --confirm to actually delete.");
  process.exit(1);
}

async function run() {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is missing. Run this from the server/ folder where .env lives.");
    process.exit(1);
  }
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const projectsCol = db.collection("projects");
  const tasksCol = db.collection("tasks");

  // Build the filter that matches tasks linked to a project.
  let filter;
  if (all) {
    filter = {
      $or: [
        { projectId: { $exists: true, $nin: [null, ""] } },
        { projectName: { $exists: true, $nin: [null, ""] } },
        { project: { $exists: true, $nin: [null, ""] } },
      ],
    };
  } else {
    const project = await projectsCol.findOne({
      $or: [
        mongoose.Types.ObjectId.isValid(projectId) ? { _id: new mongoose.Types.ObjectId(projectId) } : null,
        { id: projectId },
      ].filter(Boolean),
    });
    if (!project) {
      console.error(`No project found for id "${projectId}".`);
      process.exit(1);
    }
    const ids = [projectId, String(project._id), project.id].filter(Boolean);
    const names = [project.name].filter(Boolean);
    console.log(`Project: ${project.name} (${project._id})`);
    filter = {
      $or: [
        { projectId: { $in: ids } },
        { project: { $in: [...ids, ...names] } },
        { projectName: { $in: names } },
      ],
    };
  }

  const matches = await tasksCol.find(filter).toArray();
  console.log(`\nFound ${matches.length} task record(s) linked to ${all ? "any project" : "this project"}:`);
  matches.forEach((t) => console.log(`  - ${t.title || t.taskName || "(untitled)"}  [status: ${t.status || "?"}]`));

  if (!confirm) {
    console.log(`\nDRY RUN — nothing deleted. Re-run with --confirm to delete these ${matches.length} task(s).`);
  } else {
    const result = await tasksCol.deleteMany(filter);
    console.log(`\nDeleted ${result.deletedCount} task(s).`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
