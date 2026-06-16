const packageSchemaDefinition = {
  name: { type: "string", required: true },
  description: { type: "string", required: true },
  price: { type: "number", required: true, min: 0 },
  currency: { type: "string", required: true },
  duration: { type: "string|number", required: true },
  features: { type: "array<string>", required: true },
  isActive: { type: "boolean", default: true },
  createdAt: { type: "string", required: true },
  updatedAt: { type: "string", required: true },
};

export { packageSchemaDefinition };
