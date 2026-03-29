import { Metadata } from "next";
import { SignInForm } from "./_components/sign-in-form";

export const metadata: Metadata = {
  title: "Sign In | Tiers List",
  description: "เข้าสู่ระบบเพื่อจัดการ Tier Lists ของคุณ",
};

export default function SignInPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10 relative overflow-hidden bg-background">
      {/* Background decoration elements */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-accent/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000" />

      <div className="relative z-10 flex w-full max-w-md flex-col gap-6">
        <SignInForm />
      </div>
    </div>
  );
}
