import type { Metadata } from "next";

import { CartView } from "@/components/cart/cart-view";

export const metadata: Metadata = {
  title: "Your bag",
  description: "Review the pieces in your Hunar Bazaar bag before checkout.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return <CartView />;
}
