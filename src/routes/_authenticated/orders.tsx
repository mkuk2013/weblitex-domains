import { createFileRoute } from "@tanstack/react-router";
import { meta, OrdersPage } from "@/components/customer-portal";
export const Route = createFileRoute("/_authenticated/orders")({ head: () => meta("Orders", "Review Weblitex orders, payments, and promo codes."), component: OrdersPage });
