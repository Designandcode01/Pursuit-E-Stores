import { FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
        <FileQuestion aria-hidden="true" className="size-6" />
      </span>
      <h1 className="mt-4 font-display text-2xl text-stone-900">Not found</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        This record does not exist, or it was deleted by another admin.
      </p>
      <Button asChild className="mt-6">
        <Link href="/admin">Back to overview</Link>
      </Button>
    </div>
  );
}
