import { requestAdmin } from "../../client/api/adminApiClient.js";

function createPackageApi() {
  return {
    list() {
      return requestAdmin("/api/admin/packages");
    },
    create(payload) {
      return requestAdmin("/api/admin/packages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update(id, payload) {
      return requestAdmin(`/api/admin/packages/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    remove(id) {
      return requestAdmin(`/api/admin/packages/${id}`, {
        method: "DELETE",
      });
    },
  };
}

export { createPackageApi };
