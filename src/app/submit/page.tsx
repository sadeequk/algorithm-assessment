"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  EXAMPLE_CUSTOMER_EMAIL,
  EXAMPLE_SUPPORT_MESSAGES,
} from "@/constants";

export default function SubmitPage() {
  const router = useRouter();
  const [customerMessage, setCustomerMessage] = useState<string>(
    EXAMPLE_SUPPORT_MESSAGES[0],
  );
  const [customerEmail, setCustomerEmail] = useState(EXAMPLE_CUSTOMER_EMAIL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerMessage, customerEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.data || "Failed to create request");
      }
      const esc = data.request?.escalation;
      if (esc?.id) {
        router.push(`/escalations/${esc.id}`);
      } else {
        router.push(`/requests/${data.request.id}`);
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>New support request</h1>
            <p className="muted">
              Send a customer message into the tool-calling agent loop.
            </p>
          </div>
        </div>
      </div>

      <div className="submit-layout">
        <div className="panel">
          <form className="stack" onSubmit={onSubmit}>
            <label>
              Customer email
              <input
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="alice@example.com"
                autoComplete="email"
              />
            </label>

            <label>
              Customer message
              <textarea
                value={customerMessage}
                onChange={(e) => setCustomerMessage(e.target.value)}
                required
                rows={5}
              />
            </label>

            {error && <div className="banner error">{error}</div>}

            <div className="row">
              <button type="submit" disabled={busy}>
                {busy ? "Running agent…" : "Submit to agent"}
              </button>
            </div>
          </form>
        </div>

        <div className="panel">
          <h2 style={{ marginTop: 0 }}>Quick examples</h2>
          <p className="muted" style={{ marginTop: 0 }}>
            Click one to fill the form. Seeded orders: 1043, 1044, 2001, 3001.
          </p>
          <div className="example-list">
            {EXAMPLE_SUPPORT_MESSAGES.map((ex) => (
              <button
                key={ex}
                type="button"
                className={`example-item ${customerMessage === ex ? "active" : ""}`}
                onClick={() => setCustomerMessage(ex)}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
