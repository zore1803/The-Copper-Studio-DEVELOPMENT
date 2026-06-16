import { requestAdmin } from "./adminApiClient.js";

function createAdminCrudApi(endpoint) {
  return {
    list(queryString = "") {
      return requestAdmin(`${endpoint}${queryString}`);
    },
    getById(id) {
      return requestAdmin(`${endpoint}/${id}`);
    },
    create(payload) {
      return requestAdmin(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update(id, payload) {
      return requestAdmin(`${endpoint}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    remove(id) {
      return requestAdmin(`${endpoint}/${id}`, {
        method: "DELETE",
      });
    },
  };
}

export { createAdminCrudApi };
