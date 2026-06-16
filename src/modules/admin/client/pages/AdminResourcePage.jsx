import React, { useEffect, useState } from "react";
import { createAdminCrudApi } from "../api/createAdminCrudApi.js";
import { AdminResourceTable } from "../components/AdminResourceTable.jsx";
import "../../pricing/client/pricing.css";

function AdminResourcePage({ title, endpoint, resource }) {
  const api = createAdminCrudApi(endpoint);
  const [items, setItems] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("active");
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    let mounted = true;

    api.list().then((result) => {
      if (!mounted) {
        return;
      }

      setItems(result.items ?? []);
    });

    return () => {
      mounted = false;
    };
  }, [endpoint]);

  function handleEdit(item) {
    setEditingItem(item);
    setName(item.name ?? item.title ?? "");
    setStatus(item.status ?? "active");
  }

  async function handleDelete(item) {
    await api.remove(item.id);
    setItems((currentItems) => currentItems.filter((currentItem) => currentItem.id !== item.id));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const payload = {
      name,
      status,
    };

    if (editingItem?.id) {
      const updated = await api.update(editingItem.id, payload);
      setItems((currentItems) =>
        currentItems.map((currentItem) => (currentItem.id === editingItem.id ? updated : currentItem))
      );
    } else {
      const created = await api.create(payload);
      setItems((currentItems) => [created, ...currentItems]);
    }

    setEditingItem(null);
    setName("");
    setStatus("active");
  }

  return (
    <section className="admin-resource">
      <header>
        <h2>{title}</h2>
      </header>
      <form onSubmit={handleSubmit} className="admin-resource__form">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder={`${resource} name`} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <button type="submit">{editingItem ? "Update" : "Create"}</button>
        {editingItem ? (
          <button type="button" onClick={() => setEditingItem(null)}>
            Cancel
          </button>
        ) : null}
      </form>
      <AdminResourceTable items={items} onEdit={handleEdit} onDelete={handleDelete} />
    </section>
  );
}

export { AdminResourcePage };
