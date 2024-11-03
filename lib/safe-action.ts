import { createSafeActionClient } from "next-safe-action";

export const action = createSafeActionClient({
  handleServerError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }
    return "Une erreur est survenue";
  }
}); 