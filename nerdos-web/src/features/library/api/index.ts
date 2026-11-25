import type { LibraryRepository } from "./library-repository.ts"
import { LocalLibraryRepository } from "./local-library-repository.ts"

/**
 * The one place the data source is chosen. Swap `LocalLibraryRepository` for an HTTP-backed
 * implementation of `LibraryRepository` here when the backend is ready.
 */
export const libraryRepository: LibraryRepository = new LocalLibraryRepository()

export { LibraryRepositoryError } from "./library-repository.ts"
export type { LibraryRepository } from "./library-repository.ts"
