import { createFileRoute } from "@tanstack/react-router";
import { meta, NameserversPage } from "@/components/customer-portal";
export const Route = createFileRoute("/_authenticated/nameservers")({ head: () => meta("Nameservers", "View DNS routing for approved Weblitex subdomains."), component: NameserversPage });
