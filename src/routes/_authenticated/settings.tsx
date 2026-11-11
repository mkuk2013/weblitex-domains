import { createFileRoute } from "@tanstack/react-router";
import { meta, SettingsPage } from "@/components/customer-portal";
export const Route = createFileRoute("/_authenticated/settings")({ head: () => meta("Profile settings", "Manage your Weblitex profile and password security."), component: SettingsPage });
