import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from "@/lib/constants";
import type { OrderStatus, PaymentStatus } from "@/types/commerce";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const meta = PAYMENT_STATUS_META[status];
  return <Badge variant={meta.tone}>{meta.label}</Badge>;
}

export function StockBadge({ stock, threshold = 5 }: { stock: number; threshold?: number }) {
  if (stock <= 0) return <Badge variant="red">Sold out</Badge>;
  if (stock <= threshold) return <Badge variant="amber">Low · {stock}</Badge>;
  return <Badge variant="green">{stock} in stock</Badge>;
}
