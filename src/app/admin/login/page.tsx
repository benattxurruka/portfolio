import { adminLogin } from "@/actions/adminAuth";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-semibold text-ink-primary mb-6">Admin</h1>
        <LoginForm action={adminLogin} />
      </div>
    </div>
  );
}
