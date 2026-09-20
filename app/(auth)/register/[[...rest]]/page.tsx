import { SignUp } from "@clerk/nextjs";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center py-12" style={{ background: "var(--navy)" }}>
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-xl",
          },
          variables: {
            colorPrimary: "#00969A",
            colorBackground: "#ffffff",
          },
        }}
        fallbackRedirectUrl="/patient/dashboard"
      />
    </div>
  );
}