import type { Metadata } from "next";

import { WishlistView } from "@/components/wishlist/wishlist-view";

export const metadata: Metadata = {
  title: "Your wishlist",
  description: "Pieces you have saved for later at Hunar Bazaar.",
  robots: { index: false, follow: true },
};

export default function WishlistPage() {
  return <WishlistView />;
}
