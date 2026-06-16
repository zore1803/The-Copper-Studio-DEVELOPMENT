import { buildAdminAuthService } from "../services/adminAuth.service.js";

const adminAuthService = buildAdminAuthService();

async function signIn(request, response) {
  const result = await adminAuthService.signIn(request.body);
  return response.status(200).json(result);
}

async function me(request, response) {
  const result = await adminAuthService.getSession(request.user);
  return response.status(200).json(result);
}

export { signIn, me };
