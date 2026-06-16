import React, { useState } from "react";
import { createAdminCrudApi } from "../api/createAdminCrudApi.js";
import { AdminResourceTable } from "../components/AdminResourceTable.jsx";

function AdminDeliverablesPage() {
  const [projectId, setProjectId] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [items, setItems] = useState([]);
  const endpoint = projectId ? `/api/admin/projects/${projectId}/deliverables` : "/api/admin/projects/_/deliverables";
  const api = createAdminCrudApi(endpoint);

  async function loadDeliverables(event) {
    event.preventDefault();
    if (!projectId) {
      setItems([]);
      return;
    }

    const result = await api.list();
    setItems(result.items ?? []);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!projectId) {
      return;
    }

    const created = await api.create({ name, status });
    setItems((currentItems) => [created, ...currentItems]);
    setName("");
    setStatus("active");
  }

  async function handleDelete(item) {
    await api.remove(item.id);
    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
  }

  return (
    <section className="admin-resource">
      <header>
        <h2>Deliverables Management</h2>
      </header>
      <form onSubmit={loadDeliverables} className="admin-resource__form">
        <input value={projectId} onChange={(event) => setProjectId(event.target.value)} placeholder="Project ID" />
        <button type="submit">Load project deliverables</button>
      </form>
      <form onSubmit={handleSubmit} className="admin-resource__form">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Deliverable name" />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="active">Active</option>
          <option value="review">Review</option>
          <option value="published">Published</option>
        </select>
        <button type="submit">Create</button>
      </form>
      <AdminResourceTable items={items} onDelete={handleDelete} />
    </section>
  );
}

export { AdminDeliverablesPage };
