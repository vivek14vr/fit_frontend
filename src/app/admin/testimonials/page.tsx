"use client";
/* eslint-disable @next/next/no-img-element */

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useModalAccessibility } from "@/app/components/use-modal-accessibility";
import { apiUrl, fetchWithAuth } from "@/app/lib/auth-client";
import styles from "./page.module.css";

type Placement = "homepage" | "testimonials";
type Status = "draft" | "published" | "archived";

type Testimonial = {
  id: string;
  title: string;
  altText: string;
  imageUrl: string;
  objectKey: string | null;
  placements: Placement[];
  status: Status;
  sortOrder: number;
  createdAt?: string | null;
  updatedAt?: string | null;
};

type FormState = {
  title: string;
  altText: string;
  imageUrl: string;
  objectKey: string;
  placements: Placement[];
  status: Status;
  sortOrder: string;
  file: File | null;
};

type ApiMessage = { message?: string | string[] };

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

const emptyForm: FormState = {
  title: "",
  altText: "",
  imageUrl: "",
  objectKey: "",
  placements: ["testimonials"],
  status: "draft",
  sortOrder: "0",
  file: null,
};

function getErrorMessage(body: ApiMessage | null, fallback: string) {
  return Array.isArray(body?.message) ? body.message.join(" ") : body?.message || fallback;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function placementLabel(placement: Placement) {
  return placement === "homepage" ? "Homepage" : "Testimonials page";
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [editing, setEditing] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [modalError, setModalError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const modalRef = useModalAccessibility(Boolean(editing), () => setEditing(null));

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetchWithAuth(`${apiUrl}/admin/testimonials`, { signal: controller.signal });
        const body = (await response.json().catch(() => null)) as { testimonials?: Testimonial[] } & ApiMessage | null;
        if (!response.ok || !body?.testimonials) throw new Error(getErrorMessage(body, "Unable to load testimonials."));
        if (!cancelled) setTestimonials(body.testimonials);
      } catch (requestError) {
        if (!cancelled && !controller.signal.aborted) setError(requestError instanceof Error ? requestError.message : "Unable to load testimonials.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    const startId = window.setTimeout(() => {
      setIsLoading(true);
      setError("");
      void load();
    }, 0);
    return () => {
      cancelled = true;
      controller.abort();
      window.clearTimeout(startId);
    };
  }, [reloadKey]);

  const previewUrl = useMemo(() => {
    if (!form.file) return form.imageUrl;
    return URL.createObjectURL(form.file);
  }, [form.file, form.imageUrl]);

  useEffect(() => {
    if (!form.file || !previewUrl.startsWith("blob:")) return undefined;
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.file, previewUrl]);

  function openCreate() {
    setEditing({ id: "new", title: "New testimonial", altText: "", imageUrl: "", objectKey: null, placements: ["testimonials"], status: "draft", sortOrder: 0 });
    setForm({ ...emptyForm, placements: ["testimonials"] });
    setModalError("");
  }

  function openEdit(testimonial: Testimonial) {
    setEditing(testimonial);
    setForm({
      title: testimonial.title,
      altText: testimonial.altText,
      imageUrl: testimonial.imageUrl,
      objectKey: testimonial.objectKey ?? "",
      placements: testimonial.placements,
      status: testimonial.status,
      sortOrder: String(testimonial.sortOrder),
      file: null,
    });
    setModalError("");
  }

  function closeModal() {
    if (isSaving) return;
    setEditing(null);
    setModalError("");
  }

  function updateForm<Key extends keyof FormState>(key: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function togglePlacement(placement: Placement) {
    setForm((current) => {
      const hasPlacement = current.placements.includes(placement);
      if (hasPlacement && current.placements.length === 1) return current;
      return { ...current, placements: hasPlacement ? current.placements.filter((item) => item !== placement) : [...current.placements, placement] };
    });
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      setModalError("Use a JPG, PNG, WebP or AVIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setModalError("Images must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }
    setModalError("");
    updateForm("file", file);
  }

  async function uploadFile(file: File) {
    const response = await fetchWithAuth(`${apiUrl}/admin/testimonials/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, fileSize: file.size }),
    });
    const body = (await response.json().catch(() => null)) as { uploadUrl?: string; publicUrl?: string; objectKey?: string } & ApiMessage | null;
    if (!response.ok || !body?.uploadUrl || !body.publicUrl || !body.objectKey) throw new Error(getErrorMessage(body, "Unable to prepare the image upload."));

    const uploadResponse = await fetch(body.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!uploadResponse.ok) throw new Error("The image could not be uploaded to storage. Check the S3 CORS policy.");
    return { publicUrl: body.publicUrl, objectKey: body.objectKey };
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing || isSaving) return;
    if (!form.placements.length) {
      setModalError("Choose at least one display section.");
      return;
    }
    if (!form.file && !form.imageUrl.trim()) {
      setModalError("Upload an image or provide an HTTPS image URL.");
      return;
    }

    setIsSaving(true);
    setModalError("");
    setFeedback("");
    try {
      let imageUrl = form.imageUrl.trim();
      let objectKey = form.objectKey.trim() || undefined;
      if (form.file) {
        const upload = await uploadFile(form.file);
        imageUrl = upload.publicUrl;
        objectKey = upload.objectKey;
      }

      const payload = {
        title: form.title.trim(),
        altText: form.altText.trim(),
        imageUrl,
        ...(objectKey ? { objectKey } : {}),
        placements: form.placements,
        status: form.status,
        sortOrder: Number(form.sortOrder) || 0,
      };
      const isCreate = editing.id === "new";
      const response = await fetchWithAuth(isCreate ? `${apiUrl}/admin/testimonials` : `${apiUrl}/admin/testimonials/${encodeURIComponent(editing.id)}`, {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json().catch(() => null)) as ApiMessage | null;
      if (!response.ok) throw new Error(getErrorMessage(body, "Unable to save testimonial."));
      setEditing(null);
      setFeedback(isCreate ? "Testimonial added." : "Testimonial updated.");
      setReloadKey((current) => current + 1);
    } catch (saveError) {
      setModalError(saveError instanceof Error ? saveError.message : "Unable to save testimonial.");
    } finally {
      setIsSaving(false);
    }
  }

  async function archive(testimonial: Testimonial) {
    if (archivingId || !window.confirm(`Archive “${testimonial.title}”? It will disappear from the public site.`)) return;
    setArchivingId(testimonial.id);
    setError("");
    try {
      const response = await fetchWithAuth(`${apiUrl}/admin/testimonials/${encodeURIComponent(testimonial.id)}`, { method: "DELETE" });
      const body = (await response.json().catch(() => null)) as ApiMessage | null;
      if (!response.ok) throw new Error(getErrorMessage(body, "Unable to archive testimonial."));
      setFeedback("Testimonial archived.");
      setReloadKey((current) => current + 1);
    } catch (archiveError) {
      setError(archiveError instanceof Error ? archiveError.message : "Unable to archive testimonial.");
    } finally {
      setArchivingId(null);
    }
  }

  return (
    <>
      <div className={`admin-users-content ${styles.page}`}>
        <p className="dashboard-eyebrow">PUBLISHING / TESTIMONIALS</p>
        <div className="dashboard-heading-row users-page-heading">
          <div>
            <h1>Testimonials</h1>
            <p className="dashboard-description">Upload approved client-story images, choose where they appear, and control their order without changing the website code.</p>
          </div>
          <button className="users-create-button" type="button" onClick={openCreate}>Add testimonial <span aria-hidden="true">↗</span></button>
        </div>
        {error ? <p className="users-feedback users-feedback-error" role="alert">{error}</p> : null}
        {feedback ? <p className="users-feedback users-feedback-success" role="status">{feedback}</p> : null}

        <article className="users-card users-roster-card">
          <div className="users-roster-toolbar">
            <div><p className="dashboard-panel-label">STORY LIBRARY</p><h2>Approved reflections</h2></div>
            <span aria-live="polite">{testimonials.length} total</span>
          </div>
          {isLoading ? <p className="users-empty" role="status">Loading testimonials…</p> : testimonials.length === 0 ? <p className="users-empty">No testimonials yet. Add the first approved story image.</p> : (
            <div className="users-table-wrap">
              <table className={`users-table ${styles.table}`}>
                <thead><tr><th scope="col">Story</th><th scope="col">Placement</th><th scope="col">Status</th><th scope="col">Order</th><th scope="col">Updated</th><th scope="col"><span className={styles.srOnly}>Actions</span></th></tr></thead>
                <tbody>{testimonials.map((testimonial) => (
                  <tr key={testimonial.id}>
                    <th scope="row"><div className={styles.storyCell}><img src={testimonial.imageUrl} alt="" /><span>{testimonial.title}<small>{testimonial.altText}</small></span></div></th>
                    <td><div className={styles.tags}>{testimonial.placements.map((placement) => <span key={placement}>{placementLabel(placement)}</span>)}</div></td>
                    <td><span className={`${styles.status} ${styles[`status-${testimonial.status}`]}`}>{testimonial.status}</span></td>
                    <td>{testimonial.sortOrder}</td>
                    <td>{formatDate(testimonial.updatedAt ?? testimonial.createdAt)}</td>
                    <td><div className={styles.actions}><button type="button" onClick={() => openEdit(testimonial)}>Edit</button>{testimonial.status !== "archived" ? <button type="button" onClick={() => void archive(testimonial)} disabled={archivingId === testimonial.id}>{archivingId === testimonial.id ? "Archiving…" : "Archive"}</button> : null}</div></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </article>
      </div>

      {editing ? (
        <div className="users-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) closeModal(); }}>
          <section ref={modalRef} className={`users-modal ${styles.modal}`} role="dialog" aria-modal="true" aria-labelledby="testimonial-editor-title">
            <div className="users-modal-heading">
              <div><p className="dashboard-panel-label">{editing.id === "new" ? "NEW STORY" : "EDIT STORY"}</p><h2 id="testimonial-editor-title">{editing.id === "new" ? "Add a testimonial" : "Edit testimonial"}</h2><p>The public carousel uses the image, title and accessible alt text saved here.</p></div>
              <button className="users-modal-close" type="button" onClick={closeModal} aria-label="Close testimonial editor">×</button>
            </div>
            <form className="users-form" onSubmit={save}>
              <div className={styles.previewRow}>
                <div className={styles.preview}>{previewUrl ? <img src={previewUrl} alt="" /> : <span>Image preview</span>}</div>
                <div><label className="form-field"><span>Upload image</span><input type="file" accept={ACCEPTED_FILE_TYPES.join(",")} onChange={handleFileChange} /></label><p className={styles.help}>JPG, PNG, WebP or AVIF · max 10 MB. The browser uploads directly to S3 once configured.</p></div>
              </div>
              <div className="form-field"><label htmlFor="testimonial-title">Internal title</label><input id="testimonial-title" value={form.title} onChange={(event) => updateForm("title", event.target.value)} maxLength={160} required /></div>
              <div className="form-field"><label htmlFor="testimonial-alt">Image alt text</label><textarea id="testimonial-alt" value={form.altText} onChange={(event) => updateForm("altText", event.target.value)} maxLength={300} rows={3} required /></div>
              <div className="form-field"><label htmlFor="testimonial-url">Image URL <small>Optional when uploading</small></label><input id="testimonial-url" type="text" inputMode="url" placeholder="https://cdn.example.com/story.webp" value={form.imageUrl} onChange={(event) => updateForm("imageUrl", event.target.value)} /></div>
              <div className={styles.formGrid}>
                <fieldset className={styles.fieldset}><legend>Display sections</legend>{(["homepage", "testimonials"] as Placement[]).map((placement) => <label key={placement} className={styles.check}><input type="checkbox" checked={form.placements.includes(placement)} onChange={() => togglePlacement(placement)} />{placementLabel(placement)}</label>)}</fieldset>
                <div className="form-field"><label htmlFor="testimonial-status">Status</label><select id="testimonial-status" value={form.status} onChange={(event) => updateForm("status", event.target.value as Status)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div>
                <div className="form-field"><label htmlFor="testimonial-order">Display order</label><input id="testimonial-order" type="number" min="0" max="9999" step="1" value={form.sortOrder} onChange={(event) => updateForm("sortOrder", event.target.value)} /></div>
              </div>
              {modalError ? <p className="users-feedback users-feedback-error" role="alert">{modalError}</p> : null}
              <button className="users-submit" type="submit" disabled={isSaving}>{isSaving ? "Saving story…" : editing.id === "new" ? "Add testimonial" : "Save changes"}<span aria-hidden="true">↗</span></button>
            </form>
          </section>
        </div>
      ) : null}
    </>
  );
}
