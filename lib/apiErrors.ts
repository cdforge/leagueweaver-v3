export const RATE_LIMIT_MESSAGE = "League Weaver is busy right now. Try again in a few minutes.";

const FALLBACK_API_MESSAGE = "Something went wrong. Try again soon.";

export function apiErrorMessage(status: number, message?: string | null, fallback = FALLBACK_API_MESSAGE) {
  if (status === 429) return RATE_LIMIT_MESSAGE;
  return message?.trim() || fallback;
}

export function friendlyAuthMessage(message?: string | null) {
  const normalized = message?.toLowerCase() ?? "";
  if (/invalid|credential|login/.test(normalized)) return "That email or password does not match.";
  if (/already|registered|exists|duplicate/.test(normalized)) return "This email already has an account. Try signing in.";
  if (/weak|password.*short|at least|minimum|characters/.test(normalized)) return "Use at least 8 characters.";
  if (/confirm|verify|email.*not/.test(normalized)) return "Check your email to finish setting up your account.";
  return "Account sign-in is temporarily unavailable. Try again soon.";
}
