import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Create account",
  description:
    "Create a Pursuit E-Store account to save addresses, track orders and keep your wishlist in sync.",
};

export default function SignUpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-stone-900">Create your account</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join Pursuit E-Store to check out faster. We support email, Google and Pakistani phone
          numbers via OTP.
        </p>
      </div>
      <SignUp
        path="/sign-up"
        signInUrl="/sign-in"
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
