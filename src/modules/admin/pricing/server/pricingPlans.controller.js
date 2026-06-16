import { PricingPlan } from "../../../../../server/models/pricingPlan.model.js";

async function getAllPlans(request, response) {
  try {
    const plans = await PricingPlan.find({ isArchived: false }).sort({ displayOrder: 1, createdAt: 1 });
    return response.status(200).json({ plans });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to fetch plans" });
  }
}

async function getPlanById(request, response) {
  try {
    const { id } = request.params;
    const plan = await PricingPlan.findById(id);
    
    if (!plan) {
      return response.status(404).json({ message: "Plan not found" });
    }
    
    return response.status(200).json({ plan });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to fetch plan" });
  }
}

async function createPlan(request, response) {
  try {
    const planData = request.body;
    const plan = await PricingPlan.create(planData);
    return response.status(201).json({ plan });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to create plan" });
  }
}

async function updatePlan(request, response) {
  try {
    const { id } = request.params;
    const planData = request.body;
    
    const plan = await PricingPlan.findByIdAndUpdate(
      id,
      { ...planData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!plan) {
      return response.status(404).json({ message: "Plan not found" });
    }
    
    return response.status(200).json({ plan });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to update plan" });
  }
}

async function deletePlan(request, response) {
  try {
    const { id } = request.params;
    
    const plan = await PricingPlan.findByIdAndUpdate(
      id,
      { isArchived: true, updatedAt: new Date() },
      { new: true }
    );
    
    if (!plan) {
      return response.status(404).json({ message: "Plan not found" });
    }
    
    return response.status(200).json({ message: "Plan archived successfully" });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to delete plan" });
  }
}

async function duplicatePlan(request, response) {
  try {
    const { id } = request.params;
    const originalPlan = await PricingPlan.findById(id);
    
    if (!originalPlan) {
      return response.status(404).json({ message: "Plan not found" });
    }
    
    const planData = originalPlan.toObject();
    delete planData._id;
    delete planData.createdAt;
    delete planData.updatedAt;
    delete planData.__v;
    
    planData.name = `${planData.name} (Copy)`;
    planData.displayOrder = planData.displayOrder + 1;
    
    const newPlan = await PricingPlan.create(planData);
    return response.status(201).json({ plan: newPlan });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to duplicate plan" });
  }
}

async function reorderPlans(request, response) {
  try {
    const { planOrders } = request.body;
    
    const updatePromises = planOrders.map(({ id, displayOrder }) =>
      PricingPlan.findByIdAndUpdate(id, { displayOrder }, { new: true })
    );
    
    await Promise.all(updatePromises);
    
    return response.status(200).json({ message: "Plans reordered successfully" });
  } catch (error) {
    return response.status(500).json({ message: error.message || "Unable to reorder plans" });
  }
}

export {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
  duplicatePlan,
  reorderPlans,
};
