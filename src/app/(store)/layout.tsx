import { CartProvider } from "@/components/cart/cart-provider";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { WhatsAppButton } from "@/components/layout/whatsapp-button";
import { WishlistProvider } from "@/components/wishlist/wishlist-provider";
import { getCartLines } from "@/db/queries/cart";
import { getCategories } from "@/db/queries/catalog";
import { getWishlistItems } from "@/db/queries/wishlist";
import { getCurrentUser } from "@/lib/auth";

/**
 * The storefront is rendered per-request: the header reflects the signed-in
 * customer and their live cart. Catalog data is cached separately with
 * `unstable_cache` (see src/db/queries/catalog.ts) so this does not hit the
 * database for every product query.
 */
export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  const [categories, cartItems, wishlistItems] = await Promise.all([
    getCategories(),
    user ? getCartLines(user.id) : Promise.resolve([]),
    user ? getWishlistItems(user.id) : Promise.resolve([]),
  ]);

  const headerUser = user
    ? {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        imageUrl: user.imageUrl,
        role: user.role,
      }
    : null;

  return (
    <CartProvider initialItems={cartItems} isSignedIn={Boolean(user)}>
      <WishlistProvider initialItems={wishlistItems} isSignedIn={Boolean(user)}>
        <div className="flex min-h-screen flex-col">
          <SiteHeader user={headerUser} categories={categories} />
          <main id="main-content" className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <SiteFooter categories={categories} />
          <MobileBottomNav />
          <WhatsAppButton />
        </div>
      </WishlistProvider>
    </CartProvider>
  );
}
