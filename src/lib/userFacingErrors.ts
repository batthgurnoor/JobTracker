export function formatAuthError(error: unknown): string {
  const code = getErrorCode(error);
  switch (code) {
    case "auth/invalid-email":
      return "That email address does not look valid.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/user-not-found":
      return "No account found for that email.";
    case "auth/wrong-password":
      return "Incorrect password.";
    case "auth/invalid-credential":
      return "Email or password is incorrect.";
    case "auth/email-already-in-use":
      return "That email is already registered. Try signing in instead.";
    case "auth/weak-password":
      return "Password should be at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export function formatFirestoreError(error: unknown): string {
  const code = getErrorCode(error);
  if (code === "permission-denied") {
    return "You do not have permission to access these jobs. Check your Firestore rules.";
  }
  if (code === "unavailable" || code === "deadline-exceeded") {
    return "Firestore is temporarily unavailable. Try again shortly.";
  }
  return "Could not reach the database. Please try again.";
}

function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code?: string }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}
