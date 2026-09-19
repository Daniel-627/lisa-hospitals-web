import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--navy)" }}>
      <SignIn
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