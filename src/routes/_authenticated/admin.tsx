import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Check, Loader2, Tag, X, ExternalLink, RefreshCw, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SiteHeader } from "@/components/site-header";
import { createPromoCode, getAdminCustomers, getAdminOrderDetail, getAdminRequests, reviewRequest } from "@/lib/marketplace.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [
    { title: "Admin Review | Weblitex Domains" }, { name: "description", content: "Review payments and Weblitex domain requests." },
    { property: "og:title", content: "Admin Review | Weblitex Domains" }, { property: "og:description", content: "Protected Weblitex Domains administration." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] }), component: AdminPage,
});

type Requests = Awaited<ReturnType<typeof getAdminRequests>>;
type Customers = Awaited<ReturnType<typeof getAdminCustomers>>;
type OrderDetail = Awaited<ReturnType<typeof getAdminOrderDetail>>;
function AdminPage() {
  const getRequests = useServerFn(getAdminRequests); const review = useServerFn(reviewRequest); const createPromo = useServerFn(createPromoCode);
  const getCustomers = useServerFn(getAdminCustomers); const getDetail = useServerFn(getAdminOrderDetail);
  const [selected, setSelected] = useState<OrderDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [items, setItems] = useState<Requests | null>(null); const [customers, setCustomers] = useState<Customers | null>(null);
  const [requestsError, setRequestsError] = useState(""); const [customersError, setCustomersError] = useState("");
  const [loadingRequests, setLoadingRequests] = useState(true); const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [notice, setNotice] = useState(""); const [busy, setBusy] = useState(false);
  const [code, setCode] = useState(""); const [limit, setLimit] = useState(1); const [expiresAt, setExpiresAt] = useState("");
  const refresh = async () => {
    setLoadingRequests(true); setLoadingCustomers(true);
    setRequestsError(""); setCustomersError("");
    const [requestResult, customerResult] = await Promise.allSettled([getRequests(), getCustomers()]);
    if (requestResult.status === "fulfilled") setItems(requestResult.value);
    else setRequestsError(requestResult.reason instanceof Error ? requestResult.reason.message : "Requests could not be loaded.");
    if (customerResult.status === "fulfilled") setCustomers(customerResult.value);
    else setCustomersError(customerResult.reason instanceof Error ? customerResult.reason.message : "Orders could not be loaded.");
    setLoadingRequests(false); setLoadingCustomers(false);
  };
  useEffect(() => { void refresh(); }, []);
  async function decide(id: string, decision: "approve" | "reject") { setBusy(true); setNotice(""); try { await review({ data: { requestId: id, decision } }); setNotice(`Request ${decision === "approve" ? "APPROVED" : "REJECTED"}.`); setSelected(null); setDetailOpen(false); await refresh(); } catch(e) { setNotice(e instanceof Error ? e.message : "REVIEW_FAILED."); } finally { setBusy(false); } }
  async function openOrder(id: string) {
    setDetailOpen(true); setDetailLoading(true); setDetailError(""); setSelected(null);
    try { setSelected(await getDetail({ data: { requestId: id } })); }
    catch (e) { setDetailError(e instanceof Error ? e.message : "Order could not be opened."); }
    finally { setDetailLoading(false); }
  }
  async function promo() { setBusy(true); setNotice(""); try { const result = await createPromo({ data: { code, usageLimit: limit, expiresAt: expiresAt || undefined } }); setNotice(`PROMO ${result.code} INITIALIZED.`); setCode(""); } catch(e) { setNotice(e instanceof Error ? e.message : "PROMO_FAILED."); } finally { setBusy(false); } }

  return <main className="min-h-screen bg-background text-foreground">
    <SiteHeader account/>
    <div className="app-shell">
      <div className="border-b border-primary/20 pb-10">
        <p className="eyebrow">Administration</p>
        <h1 className="mt-2 text-4xl font-bold sm:text-5xl">Review requests</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Verify the Easypaisa receipt and transaction ID before approving each request.
        </p>
      </div>

      {notice && <p className="mt-6 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary">{notice}</p>}

      <section className="glass-panel mt-12 p-6 sm:p-8 border-primary/30">
        <div className="flex items-center gap-3 text-primary mb-6">
          <Tag className="size-5"/><h2 className="text-lg font-semibold text-foreground">Create promo code</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-[1fr_120px_180px_auto]">
          <Input className="app-input h-12" placeholder="Private code" value={code} onChange={(e) => setCode(e.target.value)}/>
          <Input className="h-10 border-primary/20 bg-primary/5 text-xs focus-visible:ring-primary" type="number" min={1} value={limit} onChange={(e) => setLimit(Number(e.target.value))}/>
          <Input className="h-10 border-primary/20 bg-primary/5 text-[10px] uppercase focus-visible:ring-primary" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}/>
          <Button className="btn-gradient h-12 px-8" onClick={promo} disabled={busy || code.length < 4}>Create code</Button>
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-8 flex items-center justify-between border-b border-border/50 pb-4">
          <div>
            <h2 className="text-xl font-semibold">Awaiting payment review</h2>
            <p className="mt-2 text-sm text-muted-foreground">Only requests with submitted payment details appear here.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Refresh orders" onClick={() => void refresh()} disabled={loadingRequests || loadingCustomers}>
              <RefreshCw className={`size-4 ${loadingRequests || loadingCustomers ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="ghost" size="sm" asChild><Link to="/dashboard">Customer view</Link></Button>
          </div>
        </div>

        {requestsError ? (
          <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
            <p>Review requests could not be loaded: {requestsError}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void refresh()}>Try again</Button>
          </div>
        ) : loadingRequests || !items ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary size-8"/></div>
        ) : items.length === 0 ? (
          <div className="border border-dashed border-border p-20 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">
            Review queue is clear.
          </div>
        ) : (
          <div className="grid gap-6">
            {items.map((item) => (
              <article className="glass-panel p-6 sm:p-8 border-primary/10 relative overflow-hidden group" key={item.id}>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div>
                    <p className="break-all font-mono text-xl font-semibold text-primary">{item.prefix}.weblitex.com</p>
                    <p className="mt-1 text-[9px] text-muted-foreground uppercase tracking-widest">STATUS: {item.status.replaceAll("_", " ")} // VAL: PKR {item.price_pkr}.00</p>
                  </div>
                  <span className="status-pill border-primary/40 text-primary">{item.payment_status}</span>
                </div>

                <div className="mt-8 rounded-none border border-primary/20 bg-primary/5 p-4 space-y-4">
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground block mb-2">TRX_ID_REFERENCE</span>
                    <p className="text-sm font-black text-foreground break-all">{item.payment_reference ?? "WAIVED_BY_PROMO"}</p>
                  </div>
                  
                  {item.receipt_url && (
                    <div className="space-y-3">
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground block">ATTACHED_EASYPAISA_PROOF</span>
                      <a href={item.receipt_url} target="_blank" rel="noreferrer" className="block relative group/img overflow-hidden border border-primary/20 max-w-sm">
                        <img src={item.receipt_url} alt={`Receipt for ${item.prefix}`} className="max-h-72 w-full object-contain transition-transform group-hover/img:scale-105"/>
                        <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                          <ExternalLink className="text-primary size-8" />
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Button variant="outline" className="px-8 h-10 text-[10px] uppercase" onClick={() => void openOrder(item.id)}>
                    <Eye className="size-4 mr-2"/> View order
                  </Button>
                  <Button className="btn-gradient px-8 h-10 text-[10px]" onClick={() => decide(item.id, "approve")} disabled={busy}>
                    <Check className="size-4 mr-2"/> Approve
                  </Button>
                  <Button variant="outline" className="px-8 h-10 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/10 uppercase font-black" onClick={() => decide(item.id, "reject")} disabled={busy}>
                    <X className="size-4 mr-2"/> Reject
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-16">
        <div className="mb-8 flex items-center justify-between border-b border-border/50 pb-4">
          <h2 className="text-xl font-semibold">All orders and customers</h2>
          {customers && <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{customers.length} total</span>}
        </div>
        {customersError ? (
          <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
            <p>Orders could not be loaded: {customersError}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void refresh()}>Try again</Button>
          </div>
        ) : loadingCustomers || !customers ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary size-8"/></div>
        ) : customers.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center text-[10px] text-muted-foreground uppercase tracking-[0.2em]">No customer requests yet.</div>
        ) : (
          <div className="grid gap-3">
            {customers.map((row) => (
              <div key={row.id} role="button" tabIndex={0} onClick={() => void openOrder(row.id)} onKeyDown={(e) => { if (e.key === "Enter") void openOrder(row.id); }} className="glass-panel flex cursor-pointer flex-col gap-2 border-primary/10 p-4 transition-colors hover:border-primary/40 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <p className="break-all font-mono text-sm font-semibold text-primary">{row.prefix}.weblitex.com</p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{row.customer_email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-widest">
                  <span className="status-pill border-primary/40 text-primary">{row.status.replaceAll("_", " ")}</span>
                  <span className="text-muted-foreground">PKR {row.price_pkr}</span>
                  <span className="text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</span>
                  {row.expires_at && <span className="text-muted-foreground">exp {new Date(row.expires_at).toLocaleDateString()}</span>}
                  <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase" onClick={(e) => { e.stopPropagation(); void openOrder(row.id); }}>
                    <Eye className="size-4 mr-1"/> View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) { setSelected(null); setDetailError(""); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="break-all font-mono">{selected ? `${selected.prefix}.weblitex.com` : "Order detail"}</DialogTitle>
            <DialogDescription>Full order record for review. Approve only after verifying the payment proof.</DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary size-8"/></div>
          ) : detailError ? (
            <div className="border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
              <p>Order could not be opened: {detailError}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setDetailOpen(false)}>Close</Button>
            </div>
          ) : selected ? (
            <div className="space-y-6">
              <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Customer</dt><dd className="mt-1 break-all font-medium">{selected.customer_email}</dd></div>
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Status</dt><dd className="mt-1"><span className="status-pill border-primary/40 text-primary">{selected.status.replaceAll("_", " ")}</span></dd></div>
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Payment status</dt><dd className="mt-1"><span className="status-pill border-primary/40 text-primary">{selected.payment_status}</span></dd></div>
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Price</dt><dd className="mt-1 font-medium">PKR {selected.price_pkr}.00{selected.promo_applied ? " (promo applied)" : ""}</dd></div>
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Transaction ID</dt><dd className="mt-1 break-all font-mono text-xs">{selected.payment_reference ?? "WAIVED_BY_PROMO"}</dd></div>
                <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Requested</dt><dd className="mt-1">{new Date(selected.created_at).toLocaleString()}</dd></div>
                {selected.reviewed_at && <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Reviewed</dt><dd className="mt-1">{new Date(selected.reviewed_at).toLocaleString()}</dd></div>}
                {selected.expires_at && <div><dt className="text-[9px] uppercase tracking-widest text-muted-foreground">Expires</dt><dd className="mt-1">{new Date(selected.expires_at).toLocaleDateString()}</dd></div>}
              </dl>
              {selected.receipt_url ? (
                <div className="space-y-3">
                  <span className="text-[9px] uppercase tracking-widest text-muted-foreground block">Attached Easypaisa proof</span>
                  <a href={selected.receipt_url} target="_blank" rel="noreferrer" className="block overflow-hidden border border-primary/20 max-w-sm">
                    <img src={selected.receipt_url} alt={`Receipt for ${selected.prefix}`} className="max-h-72 w-full object-contain"/>
                  </a>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No receipt attached to this order yet.</p>
              )}
              {["payment_submitted", "review_pending"].includes(selected.status) ? (
                <div className="flex flex-wrap gap-4">
                  <Button className="btn-gradient px-8 h-10 text-[10px]" onClick={() => decide(selected.id, "approve")} disabled={busy}>
                    <Check className="size-4 mr-2"/> Approve
                  </Button>
                  <Button variant="outline" className="px-8 h-10 text-[10px] border-destructive/30 text-destructive hover:bg-destructive/10 uppercase font-black" onClick={() => decide(selected.id, "reject")} disabled={busy}>
                    <X className="size-4 mr-2"/> Reject
                  </Button>
                </div>
              ) : (
                <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                  {selected.status === "awaiting_payment"
                    ? "Payment abhi submit nahi hui — approve us waqt hoga jab customer payment bhej de."
                    : `This order is already ${selected.status.replaceAll("_", " ")} — no review action needed.`}
                </p>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  </main>;
}
