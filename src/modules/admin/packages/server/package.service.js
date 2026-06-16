import { normalizePackagePayload, validatePackagePayload } from "./package.validation.js";

function resolvePackageModel(request) {
  return request.app?.locals?.models?.Package ?? request.app?.get?.("models")?.Package ?? request.packageModel ?? null;
}

function getPackageModelOrThrow(request) {
  const Package = resolvePackageModel(request);

  if (!Package) {
    const error = new Error("Package model is not configured.");
    error.status = 503;
    throw error;
  }

  return Package;
}

function serializePackage(record) {
  if (!record) {
    return null;
  }

  return {
    id: String(record._id ?? record.id),
    name: record.name,
    description: record.description,
    price: record.price,
    duration: record.duration,
    features: Array.isArray(record.features) ? record.features : [],
    isActive: record.isActive ?? true,
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
  };
}

async function listPackages(request) {
  const Package = getPackageModelOrThrow(request);

  const query = Package.find({}).sort({ createdAt: -1 });
  const records = typeof query.lean === "function" ? await query.lean() : await query;
  return records.map(serializePackage);
}

async function createPackage(request, payload) {
  const validation = validatePackagePayload(payload);

  if (!validation.valid) {
    return {
      error: "Validation failed.",
      details: validation.errors,
      status: 400,
    };
  }

  const Package = getPackageModelOrThrow(request);
  const normalizedPayload = normalizePackagePayload({
    ...payload,
    isActive: payload.isActive ?? true,
  });
  const withTimestamps = {
    ...normalizedPayload,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const createdRecord = await Package.create(withTimestamps);
  return serializePackage(createdRecord);
}

async function updatePackage(request, id, payload) {
  const validation = validatePackagePayload(payload, { partial: true });

  if (!validation.valid) {
    return {
      error: "Validation failed.",
      details: validation.errors,
      status: 400,
    };
  }

  const Package = getPackageModelOrThrow(request);
  const existingRecord = await Package.findById(id);

  if (!existingRecord) {
    return {
      error: "Package not found.",
      status: 404,
    };
  }

  const normalizedPayload = normalizePackagePayload(payload, existingRecord.toObject?.() ?? existingRecord);
  const updatedRecord = await Package.findByIdAndUpdate(
    id,
    {
      ...normalizedPayload,
      updatedAt: new Date().toISOString(),
    },
    { new: true }
  );

  return serializePackage(updatedRecord);
}

async function deletePackage(request, id) {
  const Package = getPackageModelOrThrow(request);
  const existingRecord = await Package.findById(id);

  if (!existingRecord) {
    return {
      error: "Package not found.",
      status: 404,
    };
  }

  const updatedRecord = await Package.findByIdAndUpdate(
    id,
    {
      isActive: false,
      updatedAt: new Date().toISOString(),
    },
    { new: true }
  );

  return serializePackage(updatedRecord);
}

export { listPackages, createPackage, updatePackage, deletePackage, serializePackage };
