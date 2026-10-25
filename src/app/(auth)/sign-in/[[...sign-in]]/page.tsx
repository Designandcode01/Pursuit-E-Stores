import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your Hunar Bazaar account to track orders and save your wishlist.",
};

export default function SignInPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-stone-900">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in with your email or Google account. Phone OTP is available from the Clerk sign-in
          panel.
        </p>
      </div>
      <SignIn
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/account"
        appearance={{
          variables: {
            colorPrimary: "#16a34a",
            colorForeground: "#1c1917",
            borderRadius: "0.5rem",
            fontFamily: "var(--font-geist-sans)",
          },
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none border border-stone-200",
            card: "bg-white shadow-none",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footer: "bg-transparent",
          },
        }}
      />
    </div>
  );
}
