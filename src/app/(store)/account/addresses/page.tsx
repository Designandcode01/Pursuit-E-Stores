import type { Metadata } from "next";

import { AddressManager } from "@/components/account/address-manager";
import { getAddresses } from "@/db/queries/account";
import { getCurrentUser } from "@/lib/auth";
import type { AddressView } from "@/types/commerce";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved addresses",
  robots: { index: false, follow: false },
};

export default async function AccountAddressesPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await getAddresses(user.id);
  const addresses: AddressView[] = rows.map((address) => ({
    id: address.id,
    label: address.label,
    fullName: address.fullName,
    phone: address.phone,
    province: address.province,
    city: address.city,
    postalCode: address.postalCode,
    street: address.street,
    landmark: address.landmark,
    isDefault: address.isDefault,
  }));

  return <AddressManager addresses={addresses} />;
}
