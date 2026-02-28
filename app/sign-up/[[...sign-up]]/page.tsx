import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <SignUp afterSignUpUrl="/onboarding" />
    </main>
  );
}
