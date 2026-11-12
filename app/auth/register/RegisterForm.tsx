"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { EASE } from "@/components/landing/styles";
import { AuthShell, AuthTitle, AuthLead, Field, FieldGroup, FormError, SubmitButton, authStyles as s } from "@/components/auth/auth-chrome";
import { ApplicationCertificate, type Industry } from "@/components/auth/certificate";

const INDUSTRIES: { value: Exclude<Industry, "">; label: string; sub: string }[] = [
  { value: "fashion", label: "Fashion", sub: "Garments, accessories, leather goods" },
  { value: "arts", label: "Arts", sub: "Original works, editions, sculpture" },
  { value: "collectibles", label: "Collectibles", sub: "Watches, sneakers, jewellery" },
];

type Form = {
  name: string;
  industry: Industry;
  contact_name: string;
  email: string;
  contact_phone: string;
  password: string;
};

export default function RegisterForm() {
  const reduce = useReducedMotion();
  const [form, setForm] = useState<Form>({ name: "", industry: "", contact_name: "", email: "", contact_phone: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [industryMissing, setIndustryMissing] = useState(false);

  function set<K extends keyof Form>(field: K, value: Form[K]) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.industry) {
      setIndustryMissing(true);
      document.getElementById("industry-fashion")?.focus();
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "We couldn't submit your application. Check your connection and try again.");
        return;
      }
      setDone(true);
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    } catch {
      setError("We couldn't reach Tagit. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  const certificate = <ApplicationCertificate house={form.name} industry={form.industry} submitted={done} />;
  const enter = reduce ? { initial: false as const } : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, ease: EASE } };

  return (
    <AuthShell
      room={certificate}
      caption="The certificate your customers hold after one tap. This one has your name on it."
      wide
      aside={
        <>
          <span className={s.topAsideLead}>Already approved?</span>
          <Link href="/auth/login">Sign in</Link>
        </>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div key="done" {...enter}>
            <div className={s.inlineCertificate}>{certificate}</div>
            <AuthTitle>Application received</AuthTitle>
            <AuthLead>
              We&apos;re reviewing <strong>{form.name}</strong> now. You&apos;ll hear from us at <strong>{form.email}</strong>{" "}
              within 24 hours. Once you&apos;re approved, sign in with the password you just chose to start issuing certificates.
            </AuthLead>
            <div className={s.actions}>
              <Link href="/auth/login" className={`${s.button} ${s.buttonAuto}`}>
                Go to sign in
              </Link>
              <Link href="/" className={s.quietLink}>
                Back to site
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div key="form" exit={reduce ? undefined : { opacity: 0, y: -8, transition: { duration: 0.2 } }}>
            <AuthTitle>Apply to join Tagit</AuthTitle>
            <AuthLead>Tell us about your house. We read every application and reply within 24 hours.</AuthLead>

            <form onSubmit={handleSubmit} className={s.form}>
              <FieldGroup legend="Your house">
                <Field
                  label="Brand or company name"
                  name="name"
                  autoComplete="organization"
                  placeholder="Maison Lagos"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  required
                />

                <FieldGroup legend="What you make" sub aria-describedby="industry-note">
                  <div className={s.choices} role="radiogroup" aria-invalid={industryMissing || undefined}>
                    {INDUSTRIES.map((ind) => (
                      <label key={ind.value} className={s.choice}>
                        <input
                          id={`industry-${ind.value}`}
                          type="radio"
                          name="industry"
                          value={ind.value}
                          checked={form.industry === ind.value}
                          onChange={() => {
                            set("industry", ind.value);
                            setIndustryMissing(false);
                          }}
                        />
                        <span className={s.choiceMark} aria-hidden />
                        <span className={s.choiceName}>{ind.label}</span>
                        <span className={s.choiceSub}>{ind.sub}</span>
                      </label>
                    ))}
                  </div>
                  {industryMissing ? (
                    <p id="industry-note" className={s.fieldError} role="alert">
                      Choose what your house makes. It sets up your catalogue.
                    </p>
                  ) : (
                    <p id="industry-note" className={s.hint}>
                      Restaurants and hotels are coming soon.
                    </p>
                  )}
                </FieldGroup>
              </FieldGroup>

              <FieldGroup legend="You">
                <Field
                  label="Your full name"
                  name="contact_name"
                  autoComplete="name"
                  placeholder="Amara Okonkwo"
                  value={form.contact_name}
                  onChange={(e) => set("contact_name", e.target.value)}
                  required
                />
                <Field
                  label="Business email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="hello@yourbrand.com"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  required
                />
                <Field
                  label="Phone or WhatsApp"
                  optional
                  name="contact_phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+234 800 000 0000"
                  value={form.contact_phone}
                  onChange={(e) => set("contact_phone", e.target.value)}
                />
                <Field
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  hint="At least 8 characters. You'll use it to sign in once approved."
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  minLength={8}
                />
              </FieldGroup>

              <FormError>{error}</FormError>

              <SubmitButton loading={loading} loadingLabel="Submitting application">
                Submit application
              </SubmitButton>

              <p className={s.fine}>
                By submitting, you agree to Tagit&apos;s{" "}
                <Link href="/terms" target="_blank">Terms of Service</Link> and{" "}
                <Link href="/privacy" target="_blank">Privacy Policy</Link>.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
