"use client";

import { useEffect } from "react";

import { useCart } from "@/components/cart/cart-provider";

/** Clears the client-side cart after checkout redirects to the confirmation page. */
export function ClearCartOnMount() {
  const { resetLocal } = useCart();

  useEffect(() => {
    resetLocal();
  }, [resetLocal]);

  return null;
}
