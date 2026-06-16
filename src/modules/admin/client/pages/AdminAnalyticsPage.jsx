import React from "react";
import { AdminStatCard } from "../components/AdminStatCard.jsx";

const analyticsCards = [
  { label: "Active Clients", value: "0", note: "Current client accounts" },
  { label: "Open Projects", value: "0", note: "Delivery workload" },
  { label: "Upcoming Meetings", value: "0", note: "Scheduled touchpoints" },
  { label: "Pending Deliverables", value: "0", note: "Awaiting review" },
];

function AdminAnalyticsPage() {
  return (
    <section className="admin-analytics">
      <header>
        <h2>Analytics Dashboard</h2>
      </header>
      <div className="admin-dashboard__grid">
        {analyticsCards.map((card) => (
          <AdminStatCard key={card.label} {...card} />
        ))}
      </div>
    </section>
  );
}

export { AdminAnalyticsPage };
