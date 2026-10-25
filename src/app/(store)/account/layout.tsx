import { redirect } from "next/navigation";

import { AccountNav } from "@/components/account/account-nav";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in?redirect_url=%2Faccount");

  return (
    <div className="container-page py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-10">
        <AccountNav />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
