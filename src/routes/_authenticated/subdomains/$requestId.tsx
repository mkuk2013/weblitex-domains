import { createFileRoute } from "@tanstack/react-router";
import { DnsPage, meta } from "@/components/customer-portal";
export const Route = createFileRoute("/_authenticated/subdomains/$requestId")({ head: () => meta("Subdomain DNS", "Manage DNS records for your Weblitex subdomain."), component: Page });
function Page(){ const { requestId }=Route.useParams(); return <DnsPage requestId={requestId}/>; }
