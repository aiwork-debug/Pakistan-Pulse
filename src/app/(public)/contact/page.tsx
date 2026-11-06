import type { Metadata } from "next";
import { Clock, Mail, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { kicker } from "@/lib/ui";

export const metadata: Metadata = {
  title: "Contact",
  description: "Send the Pulse newsroom a story tip, a correction request, or a general question.",
};

const DETAILS = [
  { icon: Mail, label: "Newsroom", value: "newsroom@example.com" },
  { icon: Mail, label: "Corrections", value: "corrections@example.com" },
  { icon: MapPin, label: "Address", value: "Newsroom address to be confirmed" },
  { icon: Clock, label: "Response time", value: "Response time: within 2 working days" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1280px] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <header className="flex max-w-3xl flex-col gap-4">
        <p className={kicker}>Contact</p>
        <h1 className="font-serif text-5xl leading-tight font-bold text-ink lg:text-6xl">
          Get in touch with the newsroom
        </h1>
        <p className="text-lg leading-8 text-muted">
          Story tips, corrections, and questions all reach an editor. We read every message.
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        <section aria-label="Contact form" className="relative lg:col-span-7">
          <ContactForm />
        </section>

        <aside
          aria-labelledby="contact-info-heading"
          className="flex flex-col gap-6 rounded-xl border border-border bg-surface p-8 lg:col-span-5"
        >
          <h2 id="contact-info-heading" className="font-serif text-2xl font-semibold text-ink">
            Other ways to reach us
          </h2>
          <dl className="flex flex-col gap-5 text-sm">
            {DETAILS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex gap-3">
                <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                <div>
                  <dt className="font-semibold text-ink">{label}</dt>
                  <dd className="text-muted">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
