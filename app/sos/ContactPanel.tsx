"use client";

/**
 * "Reach a person" panel: one-tap call to the saved trusted contact (or a
 * prompt to add one) plus the national de-addiction helpline. Helpline
 * numbers are static app data — never model-generated.
 */
import Link from "next/link";

interface ContactPanelProps {
  ready: boolean;
  supporter: string;
  supporterPhone: string;
}

export default function ContactPanel({
  ready,
  supporter,
  supporterPhone,
}: ContactPanelProps) {
  return (
    <section aria-label="Reach a person" className="sos-contact-panel glass p-5 sm:p-6">
      <div className="sos-contact-heading">
        <span className="sos-contact-mark" aria-hidden="true">
          ↗
        </span>
        <div>
          <h2>You don&apos;t have to hold this alone.</h2>
          <p>A real person can stay with you while the feeling passes.</p>
        </div>
      </div>
      <div className="sos-contact-actions mt-5 grid gap-3 sm:grid-cols-2">
        {ready && supporterPhone ? (
          <a
            href={`tel:${supporterPhone}`}
            className="sos-contact-button sos-contact-primary lift rounded-full bg-primary px-6 py-4 text-center text-base font-bold text-white shadow-soft hover:bg-primary-strong"
          >
            Call {supporter || "my person"}
          </a>
        ) : (
          <Link
            href="/plan"
            className="sos-contact-button sos-contact-secondary lift rounded-full border-2 border-primary bg-surface px-6 py-4 text-center text-base font-semibold text-primary shadow-soft"
          >
            Add a trusted contact
          </Link>
        )}
        <a
          href="tel:14446"
          className="sos-contact-button sos-contact-helpline lift rounded-full bg-danger px-6 py-4 text-center text-base font-bold text-white shadow-soft hover:opacity-90"
        >
          Call de-addiction helpline
        </a>
      </div>
    </section>
  );
}
