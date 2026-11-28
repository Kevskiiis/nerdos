import { API_VERSION } from "@/config/version"

const authPath = `api/v${API_VERSION}/auth`

/** Central registry of backend route paths; paths omit the leading slash for ky's prefix handling. */
export const API_ENDPOINTS = Object.freeze({
  auth: Object.freeze({
    register: `${authPath}/register`,
    login: `${authPath}/login`,
    verifyEmail: `${authPath}/verify-email`,
    resendVerification: `${authPath}/resend-verification`,
    logout: `${authPath}/logout`,
    logoutAll: `${authPath}/logout-all`,
    me: `${authPath}/me`,
    forgotPassword: `${authPath}/forgot-password`,
    resetPassword: `${authPath}/reset-password`,
    changePassword: `${authPath}/change-password`,
  }),
} as const)
