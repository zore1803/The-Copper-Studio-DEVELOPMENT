import React, { useState, useEffect } from "react";
import { AdminStatCard } from "../components/AdminStatCard.jsx";
import { requestAdmin } from "../../auth/client/adminAuthApi.js";
import "../../pricing/client/pricing.css";

function AdminDashboardPage() {
  const [stats, setStats] = useState({
    clients: 0,
    projects: 0,
    plans: 0,
    coupons: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const [clientsRes, projectsRes, plansRes, couponsRes] = await Promise.all([
        requestAdmin("/api/admin/users").catch(() => ({ users: [] })),
        requestAdmin("/api/admin/projects").catch(() => ({ projects: [] })),
        requestAdmin("/api/admin/pricing-plans").catch(() => ({ plans: [] })),
        requestAdmin("/api/admin/coupons").catch(() => ({ coupons: [] })),
      ]);

      setStats({
        clients: clientsRes.users?.length || 0,
        projects: projectsRes.projects?.length || 0,
        plans: plansRes.plans?.filter(p => p.isActive).length || 0,
        coupons: couponsRes.coupons?.filter(c => c.isActive).length || 0,
        revenue: 0,
      });
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    { label: "Total Clients", value: loading ? "..." : stats.clients, note: "Registered client accounts" },
    { label: "Active Projects", value: loading ? "..." : stats.projects, note: "Projects in progress" },
    { label: "Active Plans", value: loading ? "..." : stats.plans, note: "Pricing plans currently active" },
    { label: "Active Coupons", value: loading ? "..." : stats.coupons, note: "Discount codes available" },
  ];

  return (
    <section className="admin-dashboard">
      <header>
        <h2>Admin Dashboard</h2>
        <p>Overview of your Copper Studio admin panel</p>
      </header>
      <div className="admin-dashboard__grid">
        {dashboardCards.map((card) => (
          <AdminStatCard key={card.label} {...card} />
        ))}
      </div>
      
      <div className="admin-dashboard__quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <a href="/admin/pricing-plans/builder" className="quick-action-card">
            <h4>Create Pricing Plan</h4>
            <p>Build and configure new pricing plans</p>
          </a>
          <a href="/admin/pricing-plans/library" className="quick-action-card">
            <h4>Manage Plans</h4>
            <p>Edit, duplicate, or archive existing plans</p>
          </a>
          <a href="/admin/coupons" className="quick-action-card">
            <h4>Create Coupon</h4>
            <p>Set up discount codes and promotions</p>
          </a>
          <a href="/admin/clients" className="quick-action-card">
            <h4>View Clients</h4>
            <p>Manage client accounts and subscriptions</p>
          </a>
        </div>
      </div>

      <div className="admin-dashboard__recent-activity">
        <h3>Recent Activity</h3>
        <div className="activity-list">
          <div className="activity-item">
            <span className="activity-time">Today</span>
            <span className="activity-text">Admin dashboard loaded</span>
          </div>
          <div className="activity-item empty">
            <p>No recent activity to display</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export { AdminDashboardPage };
