export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: string;
};

export const emptyActionState: ActionState = {};

export function toFieldErrors(
  issues: { path: PropertyKey[]; message: string }[],
): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
