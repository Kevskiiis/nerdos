import { apiVersion, version } from "../../package.json"

/** Frontend release version from the package metadata. */
export const APP_VERSION = version

/** API contract version supported by this frontend, independent of its release version. */
export const API_VERSION = apiVersion
