/**
 * Password strength rules. Kept here so the API, the admin reset flow and the
 * self-service change flow cannot drift apart.
 */
export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 200;

export const PASSWORD_RULE_TEXT =
  "Ít nhất 12 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.";

const CHECKS: ReadonlyArray<{ test: RegExp; message: string }> = [
  { test: /[a-z]/, message: "Mật khẩu cần có chữ thường." },
  { test: /[A-Z]/, message: "Mật khẩu cần có chữ hoa." },
  { test: /[0-9]/, message: "Mật khẩu cần có chữ số." },
  { test: /[^A-Za-z0-9]/, message: "Mật khẩu cần có ký tự đặc biệt." },
];

/** Returns the first rule violated, or null when the password is acceptable. */
export function checkPassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH)
    return `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự.`;
  if (password.length > MAX_PASSWORD_LENGTH)
    return "Mật khẩu quá dài.";
  return CHECKS.find((check) => !check.test.test(password))?.message ?? null;
}

export function isStrongPassword(password: string) {
  return checkPassword(password) === null;
}
