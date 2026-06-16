import React from "react";

function PricingCardPreview({ plan }) {
  const calculateDiscountedPrice = () => {
    if (plan.discountPercentage > 0 && plan.originalPrice) {
      return plan.originalPrice - (plan.originalPrice * plan.discountPercentage / 100);
    }
    return null;
  };

  const discountedPrice = calculateDiscountedPrice();
  const displayPrice = discountedPrice || plan.price;

  const getBillingText = () => {
    switch (plan.billingCycle) {
      case "monthly":
        return "/month";
      case "yearly":
        return "/year";
      case "quarterly":
        return "/quarter";
      case "onetime":
        return "one-time";
      default:
        return "";
    }
  };

  const getButtonStyle = () => {
    switch (plan.ctaButtonStyle) {
      case "primary":
        return {
          backgroundColor: plan.cardHighlightColor,
          color: "white",
          border: "none",
        };
      case "secondary":
        return {
          backgroundColor: "white",
          color: plan.cardHighlightColor,
          border: `2px solid ${plan.cardHighlightColor}`,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          color: plan.cardHighlightColor,
          border: `2px solid ${plan.cardHighlightColor}`,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          color: plan.cardHighlightColor,
          border: "none",
        };
      default:
        return {
          backgroundColor: plan.cardHighlightColor,
          color: "white",
          border: "none",
        };
    }
  };

  return (
    <div
      className="pricing-card-preview"
      style={{
        border: plan.isRecommended ? `3px solid ${plan.cardHighlightColor}` : "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "24px",
        backgroundColor: "white",
        boxShadow: plan.isRecommended ? `0 10px 40px ${plan.cardHighlightColor}20` : "0 4px 6px rgba(0, 0, 0, 0.1)",
        position: "relative",
        maxWidth: "350px",
      }}
    >
      {plan.isPopular && (
        <div
          className="popular-badge"
          style={{
            position: "absolute",
            top: "-12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: plan.cardHighlightColor,
            color: "white",
            padding: "4px 16px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "bold",
            textTransform: "uppercase",
          }}
        >
          Popular
        </div>
      )}

      {plan.isRecommended && (
        <div
          className="recommended-badge"
          style={{
            position: "absolute",
            top: "12px",
            right: "12px",
            backgroundColor: "#fef3c7",
            color: "#92400e",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "bold",
          }}
        >
          ⭐ Recommended
        </div>
      )}

      <h3
        style={{
          fontSize: "24px",
          fontWeight: "bold",
          marginBottom: "8px",
          color: "#1f2937",
        }}
      >
        {plan.name}
      </h3>

      <p
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "16px",
          minHeight: "40px",
        }}
      >
        {plan.description}
      </p>

      <div className="price-section" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
          {discountedPrice !== null && (
            <span
              style={{
                fontSize: "18px",
                color: "#9ca3af",
                textDecoration: "line-through",
              }}
            >
              {plan.currency}{plan.originalPrice}
            </span>
          )}
          <span
            style={{
              fontSize: "36px",
              fontWeight: "bold",
              color: "#1f2937",
            }}
          >
            {plan.currency}{displayPrice}
          </span>
        </div>
        <span
          style={{
            fontSize: "14px",
            color: "#6b7280",
          }}
        >
          {getBillingText()}
        </span>
      </div>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: "0 0 24px 0",
        }}
      >
        {plan.features.map((feature, index) => (
          <li
            key={index}
            style={{
              padding: "8px 0",
              borderBottom: "1px solid #f3f4f6",
              fontSize: "14px",
              color: "#374151",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span style={{ color: plan.cardHighlightColor }}>✓</span>
            {feature}
          </li>
        ))}
      </ul>

      <button
        style={{
          width: "100%",
          padding: "12px 24px",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s",
          ...getButtonStyle(),
        }}
      >
        {plan.ctaButtonText}
      </button>
    </div>
  );
}

export { PricingCardPreview };
