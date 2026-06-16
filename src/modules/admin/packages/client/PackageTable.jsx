import React from "react";

function PackageTable({ packages = [], onEdit, onDisable }) {
  return (
    <table className="admin-package-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Price</th>
          <th>Currency</th>
          <th>Duration</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {packages.map((packageItem) => (
          <tr key={packageItem.id}>
            <td>{packageItem.name}</td>
            <td>{packageItem.description}</td>
            <td>{packageItem.price}</td>
            <td>{packageItem.currency}</td>
            <td>{packageItem.duration}</td>
            <td>{packageItem.isActive ? "Active" : "Disabled"}</td>
            <td>
              <button type="button" onClick={() => onEdit(packageItem)}>
                Edit
              </button>
              <button type="button" onClick={() => onDisable(packageItem)} disabled={!packageItem.isActive}>
                Disable
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export { PackageTable };
