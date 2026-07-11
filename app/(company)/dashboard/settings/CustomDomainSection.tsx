"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Lock, Check, Copy, Globe, Loader2, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { CustomDomain } from "@/types/database";

interface VerificationRecord {
  type: string;
  name: string;
  value: string;
}

interface Props {
  enabled: boolean;
  initialDomain: CustomDomain | null;
}

export function CustomDomainSection({ enabled, initialDomain }: Props) {
  const [domain, setDomain] = useState<CustomDomain | null>(initialDomain);
  const [input, setInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const records: VerificationRecord[] = Array.isArray(domain?.verification_records)
    ? (domain.verification_records as unknown as VerificationRecord[])
    : [];

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/company/domain/check", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setDomain(data.domain);
        if (data.domain?.status === "verified") {
          stopPolling();
        }
      }
    } finally {
      setChecking(false);
    }
  }, [checking, stopPolling]);

  useEffect(() => {
    if (domain?.status === "pending") {
      pollingRef.current = setInterval(checkStatus, 30_000);
    } else {
      stopPolling();
    }
    return stopPolling;
  }, [domain?.status, checkStatus, stopPolling]);

  async function connect() {
    if (!input.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/company/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: input.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setDomain(data.domain);
        setInput("");
      } else {
        toast.error(data.error ?? "Failed to connect domain.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      const res = await fetch("/api/company/domain", { method: "DELETE" });
      if (res.ok) {
        setDomain(null);
        setConfirmDisconnect(false);
        toast.success("Custom domain disconnected. Your tagitlux.com link is unaffected.");
      } else {
        const data = await res.json();
        toast.error(data.error ?? "Failed to disconnect domain.");
      }
    } finally {
      setDisconnecting(false);
    }
  }

  function copyValue(value: string) {
    navigator.clipboard.writeText(value).then(() => toast.success("Copied to clipboard"));
  }

  return (
    <section
      className="rounded-2xl p-6 mt-6"
      style={{ backgroundColor: "var(--color-pearl)", border: "1px solid var(--color-cream)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Globe size={16} style={{ color: enabled ? "var(--color-gold)" : "var(--color-mist)" }} />
        <p className="text-micro font-semibold uppercase tracking-widest" style={{ color: enabled ? "var(--color-gold)" : "var(--color-mist)" }}>
          Custom Domain
        </p>
        {!enabled && (
          <Lock size={14} style={{ color: "var(--color-mist)", marginLeft: 2 }} />
        )}
      </div>

      {/* Locked state */}
      {!enabled && (
        <div className="mt-3">
          <p className="text-body-sm" style={{ color: "var(--color-slate)" }}>
            Connect your own domain to serve your Tagit brand page. Available on Atelier and above.
          </p>
          <Link
            href="/dashboard/features"
            className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-lg text-body-sm font-medium"
            style={{ backgroundColor: "var(--color-smoke)", color: "var(--color-graphite)", border: "1px solid var(--color-cream)", textDecoration: "none" }}
          >
            View your plan <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Verified: connected state */}
      {enabled && domain?.status === "verified" && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full" style={{ backgroundColor: "#DCFCE7" }}>
              <Check size={12} style={{ color: "#166534" }} />
            </span>
            <span className="text-body-sm font-semibold" style={{ color: "#166534" }}>Connected</span>
          </div>
          <p className="text-body-sm mt-2" style={{ color: "var(--color-charcoal)" }}>
            <span className="font-medium">{domain.domain}</span> now shows your Tagit brand page.
          </p>
          <p className="text-caption mt-1" style={{ color: "var(--color-mist)" }}>
            Your tagitlux.com/{"{"}slug{"}"} link continues to work too.
          </p>

          {!confirmDisconnect ? (
            <button
              onClick={() => setConfirmDisconnect(true)}
              className="mt-4 px-4 py-2 rounded-lg text-body-sm font-medium"
              style={{ backgroundColor: "var(--color-smoke)", color: "var(--color-graphite)", border: "1px solid var(--color-cream)" }}
            >
              Disconnect
            </button>
          ) : (
            <div className="mt-4 rounded-xl px-4 py-3" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
              <p className="text-body-sm" style={{ color: "#991B1B" }}>
                Your custom domain will stop working. Your tagitlux.com link is not affected.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={disconnect}
                  disabled={disconnecting}
                  className="px-4 py-2 rounded-lg text-body-sm font-semibold"
                  style={{ backgroundColor: "#B91C1C", color: "#fff", opacity: disconnecting ? 0.6 : 1 }}
                >
                  {disconnecting ? "Disconnecting…" : "Yes, disconnect"}
                </button>
                <button
                  onClick={() => setConfirmDisconnect(false)}
                  className="px-4 py-2 rounded-lg text-body-sm font-medium"
                  style={{ backgroundColor: "var(--color-pearl)", color: "var(--color-graphite)", border: "1px solid var(--color-cream)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pending: verification instructions */}
      {enabled && domain?.status === "pending" && (
        <div className="mt-3">
          <p className="font-semibold text-body" style={{ color: "var(--color-charcoal)" }}>
            Almost there.
          </p>
          <p className="text-body-sm mt-1" style={{ color: "var(--color-slate)" }}>
            Go to where you bought your domain and add this record:
          </p>

          <div className="mt-4 rounded-xl overflow-hidden" style={{ border: "1px solid var(--color-cream)" }}>
            <div className="grid grid-cols-[80px_1fr_1fr_auto] gap-3 px-4 py-2 text-micro font-semibold uppercase tracking-wider" style={{ backgroundColor: "var(--color-smoke)", color: "var(--color-mist)", borderBottom: "1px solid var(--color-cream)" }}>
              <span>Type</span>
              <span>Name</span>
              <span>Value</span>
              <span />
            </div>
            {records.length > 0 ? records.map((rec, idx) => (
              <div key={idx} className="grid grid-cols-[80px_1fr_1fr_auto] gap-3 items-center px-4 py-3" style={{ borderTop: idx === 0 ? "none" : "1px solid var(--color-cream)" }}>
                <span className="text-body-sm font-mono font-semibold" style={{ color: "var(--color-charcoal)" }}>{rec.type}</span>
                <span className="text-body-sm font-mono" style={{ color: "var(--color-graphite)" }}>{rec.name}</span>
                <span className="text-body-sm font-mono truncate" style={{ color: "var(--color-graphite)" }}>{rec.value}</span>
                <button
                  onClick={() => copyValue(rec.value)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-micro font-medium"
                  style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", border: "1px solid var(--color-cream)" }}
                >
                  <Copy size={12} />
                  Copy
                </button>
              </div>
            )) : (
              <div className="px-4 py-3">
                <div className="grid grid-cols-[80px_1fr_1fr_auto] gap-3 items-center">
                  <span className="text-body-sm font-mono font-semibold" style={{ color: "var(--color-charcoal)" }}>CNAME</span>
                  <span className="text-body-sm font-mono" style={{ color: "var(--color-graphite)" }}>@</span>
                  <span className="text-body-sm font-mono" style={{ color: "var(--color-graphite)" }}>cname.vercel-dns.com</span>
                  <button
                    onClick={() => copyValue("cname.vercel-dns.com")}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-micro font-medium"
                    style={{ backgroundColor: "var(--color-linen)", color: "var(--color-graphite)", border: "1px solid var(--color-cream)" }}
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-3 flex gap-4 text-caption" style={{ color: "var(--color-mist)" }}>
            <span>Don&apos;t know how?</span>
            <Link href="/help/domains/namecheap" className="underline" style={{ color: "var(--color-gold)" }}>Instructions for Namecheap</Link>
            <Link href="/help/domains/godaddy" className="underline" style={{ color: "var(--color-gold)" }}>Instructions for GoDaddy</Link>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={checkStatus}
              disabled={checking}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-semibold"
              style={{ backgroundColor: "var(--color-charcoal)", color: "var(--color-pearl)", opacity: checking ? 0.6 : 1 }}
            >
              {checking && <Loader2 size={14} className="animate-spin" />}
              {checking ? "Checking…" : "Check Connection"}
            </button>
            <span className="text-caption" style={{ color: "var(--color-mist)" }}>
              Checking automatically every 30 seconds…
            </span>
          </div>

          <p className="mt-3 text-caption" style={{ color: "var(--color-mist)" }}>
            Connecting: <span className="font-medium" style={{ color: "var(--color-charcoal)" }}>{domain.domain}</span>
          </p>
        </div>
      )}

      {/* Failed state */}
      {enabled && domain?.status === "failed" && (
        <div className="mt-3">
          <div className="flex items-start gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
            <AlertTriangle size={16} style={{ color: "#B91C1C" }} className="mt-0.5 shrink-0" />
            <div>
              <p className="text-body-sm font-semibold" style={{ color: "#7F1D1D" }}>Connection failed</p>
              <p className="text-caption mt-0.5" style={{ color: "#991B1B" }}>
                {domain.failure_reason ?? "We could not verify your domain. Check that the DNS record is correct and try again."}
              </p>
            </div>
          </div>
          <button
            onClick={disconnect}
            disabled={disconnecting}
            className="mt-3 px-4 py-2 rounded-lg text-body-sm font-medium"
            style={{ backgroundColor: "var(--color-smoke)", color: "var(--color-graphite)", border: "1px solid var(--color-cream)" }}
          >
            {disconnecting ? "Removing…" : "Remove and try again"}
          </button>
        </div>
      )}

      {/* Empty state: connect form */}
      {enabled && (!domain || domain.status === "removed") && (
        <div className="mt-3">
          <p className="text-body-sm" style={{ color: "var(--color-slate)" }}>
            Already have a domain? Connect it here.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") connect(); }}
              placeholder="bushuaart.com"
              className="flex-1 px-3 py-2 rounded-lg text-body-sm"
              style={{ backgroundColor: "var(--color-smoke)", border: "1px solid var(--color-cream)", color: "var(--color-charcoal)" }}
            />
            <button
              onClick={connect}
              disabled={submitting || !input.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-semibold"
              style={{ backgroundColor: "var(--color-charcoal)", color: "var(--color-pearl)", opacity: (submitting || !input.trim()) ? 0.5 : 1 }}
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? "Connecting…" : "Connect"}
            </button>
          </div>
          <p className="mt-2 text-caption" style={{ color: "var(--color-mist)" }}>
            Enter your apex domain (e.g. bushuaart.com). www is set up automatically.
          </p>
        </div>
      )}
    </section>
  );
}
