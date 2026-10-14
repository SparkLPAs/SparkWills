// Shared between app/eligibility/page.tsx (writes it on a passed check) and
// components/auth/RegisterForm.tsx (reads it on submit) — kept out of
// app/eligibility/page.tsx itself since Next.js only allows a fixed set of
// named exports from a page file.
export const ELIGIBILITY_STORAGE_KEY = "sparkwills.eligibilityAnswers";
