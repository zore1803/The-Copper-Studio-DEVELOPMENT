import React from "react";
import "../../pricing/client/pricing.css";

function AdminResourceTable({ items = [], onEdit, onDelete }) {
  return (
    <div className="admin-resource-table">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id ?? item.name}>
              <td>{item.name ?? item.title ?? "Untitled"}</td>
              <td>{item.status ?? "Active"}</td>
              <td>{item.updatedAt ?? "Today"}</td>
              <td>
                <div className="admin-resource-table__actions">
                  <button type="button" onClick={() => onEdit?.(item)}>
                    Edit
                  </button>
                  <button type="button" className="delete" onClick={() => onDelete?.(item)}>
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export { AdminResourceTable };
