function createCrudController(service) {
  return {
    async list(request, response) {
      const data = await service.list(request.query);
      return response.status(200).json(data);
    },

    async getById(request, response) {
      const data = await service.getById(request.params.id);
      return response.status(200).json(data);
    },

    async create(request, response) {
      const data = await service.create(request.body);
      return response.status(201).json(data);
    },

    async update(request, response) {
      const data = await service.update(request.params.id, request.body);
      return response.status(200).json(data);
    },

    async remove(request, response) {
      const data = await service.remove(request.params.id);
      return response.status(200).json(data);
    },
  };
}

export { createCrudController };
