import { createPackage, deletePackage, listPackages, updatePackage } from "./package.service.js";

function respondWithError(response, error) {
  return response.status(error.status ?? 500).json({
    message: error.message ?? "An unexpected package error occurred.",
    details: error.details,
  });
}

async function list(request, response) {
  try {
    const packages = await listPackages(request);
    return response.status(200).json({ items: packages });
  } catch (error) {
    return respondWithError(response, error);
  }
}

async function create(request, response) {
  try {
    const result = await createPackage(request, request.body ?? {});

    if (result?.error) {
      return response.status(result.status ?? 400).json({
        message: result.error,
        details: result.details,
      });
    }

    return response.status(201).json(result);
  } catch (error) {
    return respondWithError(response, error);
  }
}

async function update(request, response) {
  try {
    const result = await updatePackage(request, request.params.id, request.body ?? {});

    if (result?.error) {
      return response.status(result.status ?? 400).json({
        message: result.error,
        details: result.details,
      });
    }

    return response.status(200).json(result);
  } catch (error) {
    return respondWithError(response, error);
  }
}

async function remove(request, response) {
  try {
    const result = await deletePackage(request, request.params.id);

    if (result?.error) {
      return response.status(result.status ?? 400).json({
        message: result.error,
      });
    }

    return response.status(200).json(result);
  } catch (error) {
    return respondWithError(response, error);
  }
}

export { list, create, update, remove };
