import mongoose from "mongoose";

const pricingPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    billingCycle: { 
      type: String, 
      enum: ["monthly", "yearly", "quarterly", "onetime"], 
      default: "monthly" 
    },
    currency: { type: String, default: "₹", trim: true },
    features: [{ type: String, trim: true }],
    isPopular: { type: Boolean, default: false },
    isRecommended: { type: Boolean, default: false },
    ctaButtonText: { type: String, default: "Get Started", trim: true },
    ctaButtonStyle: { 
      type: String, 
      enum: ["primary", "secondary", "outline", "ghost"], 
      default: "primary" 
    },
    cardHighlightColor: { type: String, default: "#6366f1", trim: true },
    displayOrder: { type: Number, default: 0 },
    discountPercentage: { type: Number, min: 0, max: 100, default: 0 },
    originalPrice: { type: Number, min: 0 },
    isActive: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true,
  }
);

const PricingPlan = mongoose.models.PricingPlan || mongoose.model("PricingPlan", pricingPlanSchema);

export { PricingPlan };
