import { createFileRoute } from "@tanstack/react-router";
import { meta, OverviewPage } from "@/components/customer-portal";
export const Route = createFileRoute("/_authenticated/dashboard")({ head: () => meta("Overview", "View Weblitex subdomains, recent orders, and account activity."), component: OverviewPage });
