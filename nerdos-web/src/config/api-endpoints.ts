/** Central registry of backend route paths; paths omit the leading slash for ky's prefixUrl. */
export const API_ENDPOINTS = Object.freeze({
  auth: Object.freeze({
    register: "api/v1/auth/register",
    login: "api/v1/auth/login",
    verifyEmail: "api/v1/auth/verify-email",
    resendVerification: "api/v1/auth/resend-verification",
    logout: "api/v1/auth/logout",
    logoutAll: "api/v1/auth/logout-all",
    me: "api/v1/auth/me",
    forgotPassword: "api/v1/auth/forgot-password",
    resetPassword: "api/v1/auth/reset-password",
    changePassword: "api/v1/auth/change-password",
  }),
} as const)
