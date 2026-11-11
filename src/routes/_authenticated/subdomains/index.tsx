import { createFileRoute } from "@tanstack/react-router";
import { meta, SubdomainsPage } from "@/components/customer-portal";
export const Route = createFileRoute("/_authenticated/subdomains/")({ head: () => meta("Subdomains", "Claim and manage your Weblitex subdomains."), component: SubdomainsPage });
