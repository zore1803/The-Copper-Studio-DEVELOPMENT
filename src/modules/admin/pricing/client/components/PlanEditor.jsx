import React from "react";

function PlanEditor({ plan, onChange }) {
  const handleFeatureAdd = () => {
    const newFeature = prompt("Enter new feature:");
    if (newFeature) {
      onChange("features", [...plan.features, newFeature]);
    }
  };

  const handleFeatureRemove = (index) => {
    onChange("features", plan.features.filter((_, i) => i !== index));
  };

  const handleFeatureUpdate = (index, value) => {
    const updatedFeatures = [...plan.features];
    updatedFeatures[index] = value;
    onChange("features", updatedFeatures);
  };

  return (
    <div className="plan-editor">
      <div className="editor-section">
        <h3>Basic Information</h3>
        
        <div className="form-group">
          <label>Plan Name</label>
          <input
            type="text"
            value={plan.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="e.g., Starter, Growth, Enterprise"
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={plan.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Brief description of the plan"
            rows={3}
          />
        </div>
      </div>

      <div className="editor-section">
        <h3>Pricing</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Price</label>
            <input
              type="number"
              value={plan.price}
              onChange={(e) => onChange("price", Number(e.target.value))}
              min="0"
              placeholder="999"
            />
          </div>

          <div className="form-group">
            <label>Currency</label>
            <input
              type="text"
              value={plan.currency}
              onChange={(e) => onChange("currency", e.target.value)}
              placeholder="₹"
              maxLength={3}
            />
          </div>

          <div className="form-group">
            <label>Billing Cycle</label>
            <select
              value={plan.billingCycle}
              onChange={(e) => onChange("billingCycle", e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="quarterly">Quarterly</option>
              <option value="onetime">One-time</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Discount (%)</label>
            <input
              type="number"
              value={plan.discountPercentage}
              onChange={(e) => onChange("discountPercentage", Number(e.target.value))}
              min="0"
              max="100"
              placeholder="0"
            />
          </div>

          <div className="form-group">
            <label>Original Price (for discount)</label>
            <input
              type="number"
              value={plan.originalPrice || ""}
              onChange={(e) => onChange("originalPrice", e.target.value ? Number(e.target.value) : null)}
              min="0"
              placeholder="4999"
            />
          </div>
        </div>
      </div>

      <div className="editor-section">
        <h3>Features</h3>
        <div className="features-list">
          {plan.features.map((feature, index) => (
            <div key={index} className="feature-item">
              <input
                type="text"
                value={feature}
                onChange={(e) => handleFeatureUpdate(index, e.target.value)}
                placeholder="Feature description"
              />
              <button
                className="remove-feature-btn"
                onClick={() => handleFeatureRemove(index)}
              >
                ×
              </button>
            </div>
          ))}
          <button className="add-feature-btn" onClick={handleFeatureAdd}>
            + Add Feature
          </button>
        </div>
      </div>

      <div className="editor-section">
        <h3>Display Options</h3>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={plan.isPopular}
              onChange={(e) => onChange("isPopular", e.target.checked)}
            />
            Show "Popular" Badge
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={plan.isRecommended}
              onChange={(e) => onChange("isRecommended", e.target.checked)}
            />
            Mark as Recommended
          </label>
        </div>

        <div className="form-group">
          <label>CTA Button Text</label>
          <input
            type="text"
            value={plan.ctaButtonText}
            onChange={(e) => onChange("ctaButtonText", e.target.value)}
            placeholder="Get Started"
          />
        </div>

        <div className="form-group">
          <label>CTA Button Style</label>
          <select
            value={plan.ctaButtonStyle}
            onChange={(e) => onChange("ctaButtonStyle", e.target.value)}
          >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="outline">Outline</option>
            <option value="ghost">Ghost</option>
          </select>
        </div>

        <div className="form-group">
          <label>Card Highlight Color</label>
          <input
            type="color"
            value={plan.cardHighlightColor}
            onChange={(e) => onChange("cardHighlightColor", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Display Order</label>
          <input
            type="number"
            value={plan.displayOrder}
            onChange={(e) => onChange("displayOrder", Number(e.target.value))}
            min="0"
          />
        </div>
      </div>
    </div>
  );
}

export { PlanEditor };
