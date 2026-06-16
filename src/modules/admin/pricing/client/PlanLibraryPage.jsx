import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { requestAdmin } from "../../auth/client/adminAuthApi.js";
import { PricingCardPreview } from "./components/PricingCardPreview.jsx";
import "./pricing.css";

function PlanLibraryPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await requestAdmin("/api/admin/pricing-plans");
      setPlans(response.plans || []);
    } catch (error) {
      console.error("Failed to fetch plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate("/admin/pricing-plans/builder");
  };

  const handleEdit = (planId) => {
    navigate(`/admin/pricing-plans/builder/${planId}`);
  };

  const handleDuplicate = async (planId) => {
    try {
      await requestAdmin(`/api/admin/pricing-plans/${planId}/duplicate`, {
        method: "POST",
      });
      fetchPlans();
    } catch (error) {
      console.error("Failed to duplicate plan:", error);
    }
  };

  const handleArchive = async (planId) => {
    if (!confirm("Are you sure you want to archive this plan?")) return;
    try {
      await requestAdmin(`/api/admin/pricing-plans/${planId}`, {
        method: "DELETE",
      });
      fetchPlans();
    } catch (error) {
      console.error("Failed to archive plan:", error);
    }
  };

  const handleReorder = async (planId, direction) => {
    const currentIndex = plans.findIndex((p) => p._id === planId);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= plans.length) return;

    const updatedPlans = [...plans];
    const temp = updatedPlans[currentIndex].displayOrder;
    updatedPlans[currentIndex].displayOrder = updatedPlans[newIndex].displayOrder;
    updatedPlans[newIndex].displayOrder = temp;

    try {
      await requestAdmin("/api/admin/pricing-plans/reorder", {
        method: "POST",
        body: JSON.stringify({
          planOrders: updatedPlans.map((p) => ({ id: p._id, displayOrder: p.displayOrder })),
        }),
      });
      fetchPlans();
    } catch (error) {
      console.error("Failed to reorder plans:", error);
    }
  };

  if (loading) {
    return <div className="loading">Loading plans...</div>;
  }

  return (
    <div className="plan-library">
      <div className="plan-library-header">
        <h1>Pricing Plans</h1>
        <button
          className="create-plan-button"
          onClick={handleCreate}
        >
          + Create New Plan
        </button>
      </div>

      <div className="plans-grid">
        {plans.length === 0 ? (
          <div className="empty-state">
            <p>No plans yet. Create your first plan to get started.</p>
          </div>
        ) : (
          plans.map((plan) => (
            <div key={plan._id} className="plan-card-wrapper">
              <div className="plan-card">
                <PricingCardPreview plan={plan} />
              </div>
              <div className="plan-card-actions">
                <button
                  className="action-button edit"
                  onClick={() => handleEdit(plan._id)}
                  title="Edit"
                >
                  ✏️ Edit
                </button>
                <button
                  className="action-button duplicate"
                  onClick={() => handleDuplicate(plan._id)}
                  title="Duplicate"
                >
                  📋 Duplicate
                </button>
                <button
                  className="action-button move-up"
                  onClick={() => handleReorder(plan._id, "up")}
                  title="Move Up"
                  disabled={plan.displayOrder === 0}
                >
                  ⬆️
                </button>
                <button
                  className="action-button move-down"
                  onClick={() => handleReorder(plan._id, "down")}
                  title="Move Down"
                  disabled={plan.displayOrder === plans.length - 1}
                >
                  ⬇️
                </button>
                <button
                  className="action-button archive"
                  onClick={() => handleArchive(plan._id)}
                  title="Archive"
                >
                  🗑️ Archive
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export { PlanLibraryPage };
