export function validateEmail(email: string): string | null {
  const v = email.trim();
  if (!v) return "Enter your email address.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Enter a valid email address, like name@university.edu.";
  return null;
}

export const passwordRules = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "letter", label: "Contains a letter", test: (p: string) => /[a-zA-Z]/.test(p) },
  { id: "number", label: "Contains a number", test: (p: string) => /\d/.test(p) },
];

export function validatePassword(password: string): string | null {
  if (!password) return "Create a password.";
  const failed = passwordRules.find((r) => !r.test(password));
  return failed ? `Password must meet all requirements: ${failed.label.toLowerCase()}.` : null;
}

export function validateRequired(value: string, label: string, max?: number): string | null {
  const v = value.trim();
  if (!v) return `${label} is required.`;
  if (max && v.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}
