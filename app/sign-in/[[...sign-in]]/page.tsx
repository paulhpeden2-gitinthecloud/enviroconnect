import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <SignIn afterSignInUrl="/dashboard" />
    </main>
  );
}
