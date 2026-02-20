import { ParentAuthProvider } from "@/lib/parent-auth-context";
import ParentShell from "./ParentShell";

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <ParentAuthProvider>
      <ParentShell>{children}</ParentShell>
    </ParentAuthProvider>
  );
}
