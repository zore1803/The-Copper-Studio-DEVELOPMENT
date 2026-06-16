import { authenticateAdmin } from "./adminAuth.service.js";
import { resolveUserCollection } from "./resolveUserCollection.js";

async function login(request, response) {
  try {
    const userCollection = resolveUserCollection(request);
    const result = await authenticateAdmin(request.body ?? {}, userCollection, request);

    if (result.error) {
      return response.status(result.status).json({
        message: result.error,
      });
    }

    return response.status(200).json({
      token: result.token,
      accessToken: result.token,
      user: result.user,
    });
  } catch (error) {
    return response.status(500).json({
      message: error.message || "Unable to authenticate admin.",
    });
  }
}

async function me(request, response) {
  return response.status(200).json({
    user: request.user,
  });
}

export { login, me };
