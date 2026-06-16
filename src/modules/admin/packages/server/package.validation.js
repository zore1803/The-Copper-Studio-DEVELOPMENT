function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validatePackagePayload(payload, { partial = false } = {}) {
  const errors = {};

  if (!partial || payload.name !== undefined) {
    if (!isNonEmptyString(payload.name)) {
      errors.name = "Package name is required.";
    }
  }

  if (!partial || payload.description !== undefined) {
    if (!isNonEmptyString(payload.description)) {
      errors.description = "Package description is required.";
    }
  }

  if (!partial || payload.price !== undefined) {
    const priceIsEmpty = payload.price === "" || payload.price === null || payload.price === undefined;
    const price = Number(payload.price);
    if (priceIsEmpty || !Number.isFinite(price) || price < 0) {
      errors.price = "Package price must be a valid number.";
    }
  }

  if (!partial || payload.currency !== undefined) {
    if (!isNonEmptyString(payload.currency)) {
      errors.currency = "Package currency is required.";
    }
  }

  if (!partial || payload.duration !== undefined) {
    const durationType = typeof payload.duration;
    const durationIsValid =
      (durationType === "string" && payload.duration.trim().length > 0) ||
      (durationType === "number" && Number.isFinite(payload.duration) && payload.duration >= 0);

    if (!durationIsValid) {
      errors.duration = "Package duration is required.";
    }
  }

  if (!partial || payload.features !== undefined) {
    if (!Array.isArray(payload.features)) {
      errors.features = "Features must be an array.";
    } else if (payload.features.some((feature) => !isNonEmptyString(feature))) {
      errors.features = "Each feature must be a non-empty string.";
    }
  }

  if (payload.isActive !== undefined && typeof payload.isActive !== "boolean") {
    errors.isActive = "isActive must be a boolean value.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

function normalizePackagePayload(payload, existingPackage = {}) {
  return {
    name: typeof payload.name === "string" ? payload.name.trim() : existingPackage.name,
    description: typeof payload.description === "string" ? payload.description.trim() : existingPackage.description,
    price: payload.price !== undefined ? Number(payload.price) : existingPackage.price,
    currency: typeof payload.currency === "string" ? payload.currency.trim().toUpperCase() : existingPackage.currency,
    duration: payload.duration !== undefined ? payload.duration : existingPackage.duration,
    features: Array.isArray(payload.features)
      ? payload.features.map((feature) => feature.trim()).filter(Boolean)
      : existingPackage.features ?? [],
    isActive: payload.isActive !== undefined ? payload.isActive : existingPackage.isActive ?? true,
  };
}

export { validatePackagePayload, normalizePackagePayload };
