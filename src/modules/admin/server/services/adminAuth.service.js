function buildAdminAuthService() {
  return {
    async signIn(credentials) {
      return {
        accessToken: "admin-access-token",
        user: {
          id: "admin-user-id",
          email: credentials?.email ?? "",
          role: "admin",
        },
      };
    },

    async getSession(user) {
      return {
        user,
      };
    },
  };
}

export { buildAdminAuthService };
