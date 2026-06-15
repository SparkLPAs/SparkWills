import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { isGoogleEnabled } from "@/lib/auth/auth-options";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm googleEnabled={isGoogleEnabled} />
    </Suspense>
  );
}
