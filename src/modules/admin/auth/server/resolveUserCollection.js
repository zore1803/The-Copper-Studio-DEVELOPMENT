function resolveUserCollection(request) {
  return request.app?.locals?.models?.User ?? request.app?.get?.("models")?.User ?? request.userModel ?? request.models?.User ?? request.app?.locals?.User ?? null;
}

export { resolveUserCollection };
