import { AuthBranding } from "@/components/auth/AuthBranding";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthBranding />
      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
