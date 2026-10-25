"use client";

import { useClerk } from "@clerk/nextjs";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";

export type HeaderUser = {
  firstName: string | null;
  lastName: string | null;
  email: string;
  imageUrl: string | null;
  role: "customer" | "admin";
};

export function AccountMenu({ user }: { user: HeaderUser | null }) {
  const { signOut } = useClerk();

  if (!user) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm font-medium text-stone-700 transition-colors hover:bg-muted hover:text-stone-900 lg:px-3"
      >
        <UserRound className="size-5" aria-hidden="true" />
        <span className="hidden lg:inline">Sign in</span>
        <span className="sr-only">Sign in to your account</span>
      </Link>
    );
  }

  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const isAdmin = user.role === "admin";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-full px-1.5 text-sm font-medium text-stone-700 transition-colors hover:bg-muted lg:px-2.5"
          aria-label="Open account menu"
        >
          {user.imageUrl ? (
            <Image
              src={user.imageUrl}
              alt=""
              width={30}
              height={30}
              className="size-8 rounded-full object-cover"
            />
          ) : (
            <span className="grid size-8 place-items-center rounded-full bg-brand-800 text-[11px] font-semibold text-white">
              {getInitials(name)}
            </span>
          )}
          <span className="hidden max-w-24 truncate lg:inline">
            {user.firstName ?? "Account"}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>
          <span className="block truncate text-sm font-semibold normal-case tracking-normal text-stone-900">
            {name}
          </span>
          <span className="mt-0.5 block truncate text-xs font-normal normal-case tracking-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound aria-hidden="true" /> My profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/orders">
            <Package aria-hidden="true" /> My orders
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/wishlist">
            <Heart aria-hidden="true" /> Wishlist
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account/addresses">
            <Settings aria-hidden="true" /> Addresses
          </Link>
        </DropdownMenuItem>
        {isAdmin ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin" className="font-semibold text-brand-800">
                <LayoutDashboard aria-hidden="true" /> Admin dashboard
              </Link>
            </DropdownMenuItem>
          </>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(event) => {
            event.preventDefault();
            void signOut({ redirectUrl: "/" });
          }}
          className="text-red-700 focus:bg-red-50 focus:text-red-800"
        >
          <LogOut aria-hidden="true" /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
