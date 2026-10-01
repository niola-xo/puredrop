import { Suspense } from "react";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
      <Suspense fallback={<div className="text-center text-slate-500 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
