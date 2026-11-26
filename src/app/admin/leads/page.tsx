"use client";

import { useEffect, useState } from "react";
import { apiUrl, fetchWithAuth } from "@/app/lib/auth-client";
import { useModalAccessibility } from "@/app/components/use-modal-accessibility";

type LeadStatus = "in_progress" | "submitted" | "payment_pending" | "payment_failed" | "paid" | "contacted" | "closed";
type FollowUpStatus = "new" | "contacted" | "closed";
type PaymentStatus = "not_required" | "pending" | "order_created" | "paid" | "failed";
type LeadType = "health_checkin" | "consultation_booking";

type Lead = {
  id: string;
  source: string;
  leadType: LeadType;
  name: string | null;
  email: string | null;
  phone: string | null;
  concerns: string[];
  goal: string | null;
  timeline: string | null;
  country: string | null;
  countryCode: string | null;
  region: "india" | "worldwide" | null;
  consent: boolean;
  consentedAt: string | null;
  privacyVersion: string | null;
  completedStep: number;
  status: LeadStatus;
  followUpStatus: FollowUpStatus;
  paymentStatus: PaymentStatus | null;
  paymentAmountInr: number | null;
  paymentPaidAt: string | null;
  bookingLinkReleasedAt: string | null;
  createdAt?: string;
  updatedAt?: string;
};

type PaginationMeta = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const concernLabels: Record<string, string> = {
  "mind-emotional-wellness": "Mind & emotional wellness",
  thyroid: "Thyroid nutrition support",
  liver: "Liver health",
  gut: "Gut & digestion",
  "fat-loss-metabolic": "Fat loss & metabolic health",
  skin: "Skin health",
};

function getErrorMessage(body: { message?: string | string[] } | null, fallback: string) {
  return Array.isArray(body?.message) ? body.message.join(" ") : body?.message || fallback;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatAmount(value?: number | null) {
  return value === null || value === undefined ? "—" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function progressLabel(lead: Lead) {
  if (lead.leadType === "consultation_booking") {
    return lead.completedStep >= 1 ? "Contact details saved" : "Not started";
  }
  const step = lead.completedStep;
  return `Step ${Math.min(Math.max(step, 0), 4)} of 4`;
}

function paymentLabel(lead: Lead) {
  if (!lead.paymentStatus || lead.paymentStatus === "not_required") return "No payment needed";
  return statusLabel(lead.paymentStatus);
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [leadType, setLeadType] = useState<LeadType>("health_checkin");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | LeadStatus>("all");
  const [followUpStatus, setFollowUpStatus] = useState<"all" | FollowUpStatus>("all");
  const [selectedFollowUpStatus, setSelectedFollowUpStatus] = useState<FollowUpStatus>("new");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta>({ total: 0, page: 1, limit: 20, totalPages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingFollowUp, setIsSavingFollowUp] = useState(false);
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const modalRef = useModalAccessibility(Boolean(selected), () => setSelected(null));

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const query = new URLSearchParams({ page: String(page), limit: "20" });
        query.set("leadType", leadType);
        if (search.trim()) query.set("search", search.trim());
        if (status !== "all") query.set("status", status);
        if (followUpStatus !== "all") query.set("followUpStatus", followUpStatus);
        const response = await fetchWithAuth(`${apiUrl}/admin/leads?${query.toString()}`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as { leads?: Lead[]; meta?: PaginationMeta; message?: string | string[] } | null;
        if (!response.ok || !body?.leads) throw new Error(getErrorMessage(body, "Unable to load leads."));
        if (!cancelled) {
          setLeads(body.leads);
          setPagination(body.meta ?? { total: body.leads.length, page, limit: 20, totalPages: body.leads.length > 0 ? 1 : 0 });
        }
      } catch (requestError) {
        if (!cancelled && !controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Unable to load leads.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, 300);
    return () => { cancelled = true; window.clearTimeout(timer); controller.abort(); };
  }, [followUpStatus, leadType, page, search, status]);

  function openLead(lead: Lead) {
    setSelected(lead);
    setSelectedFollowUpStatus(lead.followUpStatus);
    setModalError("");
  }

  async function saveFollowUp() {
    if (!selected || selectedFollowUpStatus === selected.followUpStatus || isSavingFollowUp) return;
    setIsSavingFollowUp(true);
    setModalError("");
    try {
      const response = await fetchWithAuth(`${apiUrl}/admin/leads/${encodeURIComponent(selected.id)}/follow-up`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpStatus: selectedFollowUpStatus }),
      });
      const body = (await response.json().catch(() => null)) as { followUpStatus?: FollowUpStatus; message?: string | string[] } | null;
      if (!response.ok || !body?.followUpStatus) throw new Error(getErrorMessage(body, "Unable to save follow-up status."));
      const next = { ...selected, followUpStatus: body.followUpStatus };
      setSelected(next);
      setLeads((current) => current.map((lead) => lead.id === next.id ? next : lead));
    } catch (requestError) {
      setModalError(requestError instanceof Error ? requestError.message : "Unable to save follow-up status.");
    } finally {
      setIsSavingFollowUp(false);
    }
  }

  const hasActiveFilters = Boolean(search.trim()) || status !== "all" || followUpStatus !== "all";
  const isConsultationTab = leadType === "consultation_booking";

  function selectLeadType(nextLeadType: LeadType) {
    if (nextLeadType === leadType) return;
    setLeadType(nextLeadType);
    setPage(1);
    setSelected(null);
  }

  return (
    <>
      <div className="admin-users-content leads-page">
        <p className="dashboard-eyebrow">PRACTICE OPERATIONS / LEADS</p>
        <div className="dashboard-heading-row users-page-heading">
          <div>
            <h1>Leads</h1>
            <p className="dashboard-description">Every contact request is saved here, including unfinished check-ins and 1:1 requests before or after payment.</p>
          </div>
        </div>
        {error ? <p className="users-feedback users-feedback-error" role="alert">{error}</p> : null}

        <article className="users-card users-roster-card leads-roster-card">
          <div className="leads-tabs" role="tablist" aria-label="Lead source">
            <button id="health-checkin-tab" type="button" role="tab" aria-selected={!isConsultationTab} aria-controls="lead-directory" onClick={() => selectLeadType("health_checkin")}>Health check-in popup</button>
            <button id="one-to-one-tab" type="button" role="tab" aria-selected={isConsultationTab} aria-controls="lead-directory" onClick={() => selectLeadType("consultation_booking")}>1:1 scheduling</button>
          </div>
          <div className="users-roster-toolbar leads-toolbar">
            <div><p className="dashboard-panel-label">LEAD DIRECTORY</p><h2>{isConsultationTab ? "1:1 scheduling requests" : "Health check-in submissions"}</h2></div>
            <span aria-live="polite">{pagination.total} total leads</span>
          </div>

          <div className="leads-filters">
            <label className="users-search" htmlFor="lead-search"><span>Search by name, email, phone or country</span><input id="lead-search" type="search" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} /></label>
            <label className="leads-status-filter" htmlFor="lead-status"><span>Journey</span><select id="lead-status" value={status} onChange={(event) => { setPage(1); setStatus(event.target.value as "all" | LeadStatus); }}><option value="all">All journeys</option><option value="in_progress">In progress</option><option value="submitted">Submitted</option><option value="payment_pending">Payment pending</option><option value="payment_failed">Payment failed</option><option value="paid">Paid</option></select></label>
            <label className="leads-status-filter" htmlFor="lead-follow-up"><span>Follow-up</span><select id="lead-follow-up" value={followUpStatus} onChange={(event) => { setPage(1); setFollowUpStatus(event.target.value as "all" | FollowUpStatus); }}><option value="all">All follow-up</option><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></label>
          </div>

          {isLoading ? <p className="users-empty" aria-live="polite">Loading leads…</p> : leads.length === 0 ? <p className="users-empty">{hasActiveFilters ? "No leads match these filters." : isConsultationTab ? "No 1:1 scheduling requests have been captured yet." : "No health check-in leads have been captured yet."}</p> : (
            <div id="lead-directory" className="users-table-wrap" role="tabpanel" aria-labelledby={isConsultationTab ? "one-to-one-tab" : "health-checkin-tab"}>
              <table className="users-table leads-table">
                <thead><tr><th scope="col">Lead</th><th scope="col">Progress</th><th scope="col">Journey</th><th scope="col">Follow-up</th><th scope="col">Payment</th><th scope="col">Received</th></tr></thead>
                <tbody>{leads.map((lead) => (
                  <tr key={lead.id}>
                    <th scope="row"><button className="lead-row-open" type="button" onClick={() => openLead(lead)}>{lead.name ?? "Unnamed visitor"}<small>{lead.email ?? "Email not provided"}</small></button></th>
                    <td>{progressLabel(lead)}</td>
                    <td><span className={`lead-status lead-status-${lead.status}`}>{statusLabel(lead.status)}</span></td>
                    <td><span className={`lead-follow-up lead-follow-up-${lead.followUpStatus}`}>{statusLabel(lead.followUpStatus)}</span></td>
                    <td>{paymentLabel(lead)}</td>
                    <td>{formatDateTime(lead.createdAt)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}

          <div className="users-pagination" aria-label="Leads pagination">
            <button type="button" className="users-pagination-button" disabled={isLoading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>Previous</button>
            <span>Page {pagination.page} of {Math.max(pagination.totalPages, 1)}</span>
            <button type="button" className="users-pagination-button" disabled={isLoading || page >= pagination.totalPages} onClick={() => setPage((current) => current + 1)}>Next</button>
          </div>
        </article>
      </div>

      {selected ? (
        <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
          <section ref={modalRef} className="users-modal lead-detail-modal" role="dialog" aria-modal="true" aria-labelledby="lead-detail-title">
            <div className="users-modal-heading"><div><p className="dashboard-panel-label">{selected.leadType === "consultation_booking" ? "1:1 SCHEDULING REQUEST" : "HEALTH CHECK-IN LEAD"}</p><h2 id="lead-detail-title">{selected.name ?? "Unnamed visitor"}</h2><p>{statusLabel(selected.status)} · {progressLabel(selected)}</p></div><button className="users-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close lead details">×</button></div>
            <div className="lead-detail-grid">
              <div><span>Name</span><strong>{selected.name ?? "—"}</strong></div><div><span>Email</span><strong>{selected.email ?? "—"}</strong></div>
              <div><span>Phone / WhatsApp</span><strong>{selected.phone ?? "—"}</strong></div><div><span>Country or region</span><strong>{selected.country ?? "—"}{selected.countryCode ? ` (${selected.countryCode})` : ""}</strong></div>
              <div><span>Declared region</span><strong>{selected.region ? statusLabel(selected.region) : "Not reached"}</strong></div><div><span>Timeline</span><strong>{selected.timeline ?? "Not reached"}</strong></div>
              <div><span>Payment</span><strong>{paymentLabel(selected)}{selected.paymentAmountInr ? ` · ${formatAmount(selected.paymentAmountInr)}` : ""}</strong></div><div><span>Payment confirmed</span><strong>{formatDateTime(selected.paymentPaidAt)}</strong></div>
              <div><span>Consent</span><strong>{selected.consent ? `Accepted · policy ${selected.privacyVersion ?? "unknown"}` : "Not recorded"}</strong></div><div><span>Scheduling released</span><strong>{formatDateTime(selected.bookingLinkReleasedAt)}</strong></div>
              <div className="lead-detail-wide"><span>Health focus</span><strong>{selected.leadType === "consultation_booking" ? "Not collected in the 1:1 scheduling form" : selected.concerns.length ? selected.concerns.map((concern) => concernLabels[concern] ?? concern).join(", ") : "Not reached"}</strong></div>
              <div className="lead-detail-wide"><span>Goal</span><strong>{selected.leadType === "consultation_booking" ? "Not collected in the 1:1 scheduling form" : selected.goal ?? "Not reached"}</strong></div>
              <div className="lead-detail-wide"><span>Captured</span><strong>{formatDateTime(selected.createdAt)}</strong></div><div className="lead-detail-wide"><span>Last updated</span><strong>{formatDateTime(selected.updatedAt)}</strong></div>
            </div>
            <div className="lead-follow-up-editor">
              <label htmlFor="lead-follow-up-editor"><span>Follow-up status</span><select id="lead-follow-up-editor" value={selectedFollowUpStatus} onChange={(event) => setSelectedFollowUpStatus(event.target.value as FollowUpStatus)} disabled={isSavingFollowUp}><option value="new">New</option><option value="contacted">Contacted</option><option value="closed">Closed</option></select></label>
              <button type="button" onClick={() => void saveFollowUp()} disabled={isSavingFollowUp || selectedFollowUpStatus === selected.followUpStatus}>{isSavingFollowUp ? "Saving…" : "Save follow-up"}</button>
            </div>
            {modalError ? <p className="users-feedback users-feedback-error" role="alert">{modalError}</p> : null}
          </section>
        </div>
      ) : null}
    </>
  );
}
