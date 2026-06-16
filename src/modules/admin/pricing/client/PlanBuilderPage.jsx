import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { requestAdmin } from "../../auth/client/adminAuthApi.js";
import { PlanEditor } from "./components/PlanEditor.jsx";
import { PricingCardPreview } from "./components/PricingCardPreview.jsx";
import "./pricing.css";

function PlanBuilderPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState({
    name: "",
    description: "",
    price: 0,
    billingCycle: "monthly",
    currency: "₹",
    features: [],
    isPopular: false,
    isRecommended: false,
    ctaButtonText: "Get Started",
    ctaButtonStyle: "primary",
    cardHighlightColor: "#6366f1",
    displayOrder: 0,
    discountPercentage: 0,
    originalPrice: null,
    isActive: true,
  });
  const [previewMode, setPreviewMode] = useState("desktop");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(!!planId);

  useEffect(() => {
    if (planId) {
      loadPlan(planId);
    }
  }, [planId]);

  const loadPlan = async (id) => {
    setLoading(true);
    try {
      const response = await requestAdmin(`/api/admin/pricing-plans/${id}`);
      setPlan(response.plan);
    } catch (error) {
      console.error("Failed to load plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (field, value) => {
    setPlan((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (planId) {
        await requestAdmin(`/api/admin/pricing-plans/${planId}`, {
          method: "PUT",
          body: JSON.stringify(plan),
        });
      } else {
        await requestAdmin("/api/admin/pricing-plans", {
          method: "POST",
          body: JSON.stringify(plan),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save plan:", error);
      alert("Failed to save plan. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "desktop":
      default:
        return "100%";
    }
  };

  if (loading) {
    return <div className="loading">Loading plan...</div>;
  }

  return (
    <div className="plan-builder">
      <div className="plan-builder-header">
        <h1>{planId ? "Edit Plan" : "Create New Plan"}</h1>
        <div className="plan-builder-actions">
          <div className="preview-mode-selector">
            <button
              className={previewMode === "desktop" ? "active" : ""}
              onClick={() => setPreviewMode("desktop")}
            >
              Desktop
            </button>
            <button
              className={previewMode === "tablet" ? "active" : ""}
              onClick={() => setPreviewMode("tablet")}
            >
              Tablet
            </button>
            <button
              className={previewMode === "mobile" ? "active" : ""}
              onClick={() => setPreviewMode("mobile")}
            >
              Mobile
            </button>
          </div>
          <button
            className="cancel-button"
            onClick={() => navigate("/admin/pricing-plans/library")}
          >
            Cancel
          </button>
          <button
            className="save-button"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : saved ? "Saved!" : "Save Plan"}
          </button>
        </div>
      </div>

      <div className="plan-builder-content">
        <div className="plan-editor-section">
          <PlanEditor plan={plan} onChange={handlePlanChange} />
        </div>

        <div className="plan-preview-section">
          <div className="preview-container" style={{ width: getPreviewWidth() }}>
            <div className="preview-label">
              {previewMode.charAt(0).toUpperCase() + previewMode.slice(1)} Preview
            </div>
            <PricingCardPreview plan={plan} />
          </div>
        </div>
      </div>
    </div>
  );
}

export { PlanBuilderPage };
