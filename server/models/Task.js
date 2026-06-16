import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    title: { type: String, required: true, trim: true, index: true },
    project: { type: String, trim: true, index: true, default: "" },
    status: { type: String, default: "Backlog", index: true },
    priority: { type: String, default: "Medium", index: true },
    assignee: { type: String, default: "A" },
    deadline: { type: String, default: "" },
    description: { type: String, default: "" },
    subtasks: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
