function getAdminPrincipal(request) {
  if (request.user) {
    return request.user;
  }

  if (request.adminUser) {
    return request.adminUser;
  }

  const role = request.headers["x-admin-role"];
  const id = request.headers["x-admin-id"];
  const email = request.headers["x-admin-email"];

  if (!role) {
    return null;
  }

  return {
    id: id ?? "admin-session",
    email: email ?? "",
    role,
  };
}

export { getAdminPrincipal };
