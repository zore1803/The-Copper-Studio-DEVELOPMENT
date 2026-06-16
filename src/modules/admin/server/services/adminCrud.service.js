const emptyResult = Object.freeze({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
});

function buildCrudService(resourceName, repository) {
  const store = repository ?? {};

  return {
    async list(query = {}) {
      if (typeof store.list === "function") {
        return store.list(query);
      }

      return {
        ...emptyResult,
        resourceName,
        query,
      };
    },

    async getById(id) {
      if (typeof store.getById === "function") {
        return store.getById(id);
      }

      return {
        id,
        resourceName,
      };
    },

    async create(payload) {
      if (typeof store.create === "function") {
        return store.create(payload);
      }

      return {
        id: `mock-${resourceName}`,
        ...payload,
      };
    },

    async update(id, payload) {
      if (typeof store.update === "function") {
        return store.update(id, payload);
      }

      return {
        id,
        ...payload,
      };
    },

    async remove(id) {
      if (typeof store.remove === "function") {
        return store.remove(id);
      }

      return {
        id,
        removed: true,
      };
    },
  };
}

export { buildCrudService };
