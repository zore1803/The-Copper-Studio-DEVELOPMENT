import React from "react";
import "../../pricing/client/pricing.css";

function AdminStatCard({ label, value, note }) {
  return (
    <article className="admin-stat-card">
      <div className="admin-stat-card__label">{label}</div>
      <div className="admin-stat-card__value">{value}</div>
      <div className="admin-stat-card__note">{note}</div>
    </article>
  );
}

export { AdminStatCard };
