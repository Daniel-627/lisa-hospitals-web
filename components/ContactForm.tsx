"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { ErrorBox, Field, SuccessBox, inputCls, inputStyle } from "@/components/ui";
import { errMsg } from "@/lib/format";

const empty = { name: "", email: "", phone: "", subject: "", message: "", website: "" };

export default function ContactForm() {
  const [form, setForm] = useState(empty);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSent(false);
    setForm({ ...form, [k]: e.target.value });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSent(false);
    setSending(true);
    try {
      await api.post("/api/contact", { ...form, phone: form.phone.trim() || undefined });
      setSent(true);
      setForm(empty);
    } catch (err: any) {
      setError(err.response?.status === 429 ? "You've sent several messages recently. Please try again later or call us." : errMsg(err, "Couldn't send your message. Please try again or call us."));
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && <ErrorBox>{error}</ErrorBox>}
      {sent && <SuccessBox>Thank you — we&apos;ll get back to you soon.</SuccessBox>}

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Your name" htmlFor="c-name"><input id="c-name" required value={form.name} maxLength={100} onChange={set("name")} className={inputCls} style={inputStyle} autoComplete="name" /></Field>
        <Field label="Email" htmlFor="c-email"><input id="c-email" type="email" required value={form.email} maxLength={255} onChange={set("email")} className={inputCls} style={inputStyle} autoComplete="email" /></Field>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Phone (optional)" htmlFor="c-phone"><input id="c-phone" type="tel" value={form.phone} maxLength={30} onChange={set("phone")} className={inputCls} style={inputStyle} placeholder="0712 345 678" autoComplete="tel" /></Field>
        <Field label="Subject" htmlFor="c-subject"><input id="c-subject" required value={form.subject} maxLength={150} onChange={set("subject")} className={inputCls} style={inputStyle} /></Field>
      </div>
      <Field label="Message" htmlFor="c-message">
        <textarea id="c-message" required rows={5} value={form.message} maxLength={2000} onChange={set("message")} className={`${inputCls} resize-none`} style={inputStyle} />
      </Field>

      {/* Honeypot: hidden from people, tempting for bots. */}
      <div className="hidden" aria-hidden>
        <label>Website<input tabIndex={-1} autoComplete="off" value={form.website} onChange={set("website")} /></label>
      </div>

      <p className="text-xs" style={{ color: "var(--grey-400)" }}>For emergencies, please call or come in — don&apos;t use this form.</p>
      <button type="submit" disabled={sending} className="px-8 py-3 rounded-lg text-sm font-semibold text-white disabled:opacity-70" style={{ background: sending ? "var(--teal-dark)" : "var(--teal)" }}>
        {sending ? "Sending..." : "Send message"}
      </button>
    </form>
  );
}
