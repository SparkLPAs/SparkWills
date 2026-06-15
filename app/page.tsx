import Link from "next/link";
import { JURISDICTION, PRICING } from "@/lib/constants";
import { siteConfig } from "@/config/site.config";

const benefits = [
  {
    title: "Single or mirror wills",
    body: "Make a will just for you, or matching mirror wills for you and your partner.",
  },
  {
    title: "Plain English, done in minutes",
    body: "A guided, jargon-free process — your answers save as you go, so you can stop and resume any time.",
  },
  {
    title: "Choose your executors",
    body: "Appoint people you trust, or our recommended professional executors to take the burden off your family.",
  },
  {
    title: "Protect your loved ones",
    body: "Name guardians for children under 18 and decide exactly who inherits, and in what shares.",
  },
];

const steps = [
  { n: 1, title: "Check eligibility", body: "A few quick questions confirm a simple will suits you." },
  { n: 2, title: "Guided wizard", body: "Plain-English steps capture everything your will needs." },
  { n: 3, title: "Proof & check", body: "Automated checks flag anything missing before you pay." },
  { n: 4, title: "Compile & sign", body: "Download your will plus signing and storage guides, ready to execute." },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-cream-100 to-cream-50">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-navy-200 bg-white px-3 py-1 text-xs font-medium text-navy-700">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            {JURISDICTION} · Simple online wills
          </span>
          <h1 className="mt-6 max-w-3xl text-balance font-serif text-4xl font-bold leading-tight text-navy-900 sm:text-5xl">
            Make your will online — simply, and done properly.
          </h1>
          <p className="mt-6 max-w-prose text-lg leading-relaxed text-navy-700">
            {siteConfig.business.name} guides you through a straightforward single
            or mirror will in plain English, for individuals and couples in{" "}
            {JURISDICTION}. We make it simple; you stay in control.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="/eligibility" className="btn-primary px-7 py-3 text-base">
              Start your will
            </Link>
            <span className="text-sm text-navy-600">
              From {PRICING.single.price} · no account needed to start
            </span>
          </div>
          <p className="mt-6 max-w-prose text-sm text-navy-600">
            This service provides legal <em>information</em> and document templates —
            not legal advice. For straightforward estates in {JURISDICTION}.
          </p>
        </div>
      </section>

      {/* What it does */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">
          Everything a straightforward will needs
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {benefits.map((b) => (
            <div key={b.title} className="card p-6">
              <h3 className="font-serif text-lg font-semibold text-navy-800">
                {b.title}
              </h3>
              <p className="mt-2 text-navy-700">{b.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-cream-100">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-serif text-2xl font-semibold text-navy-900 sm:text-3xl">
            How it works
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <li key={s.n} className="card p-6">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-navy-800 font-serif text-cream-50">
                  {s.n}
                </span>
                <h3 className="mt-4 font-serif text-lg font-semibold text-navy-800">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-navy-700">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Who it's not for */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="card border-warning/30 bg-amber-50/40 p-8">
          <h2 className="font-serif text-xl font-semibold text-navy-900">
            Is a simple will right for you?
          </h2>
          <p className="mt-3 max-w-prose text-navy-700">
            A simple will suits most straightforward estates. It is{" "}
            <strong>not</strong> the right tool for more complex situations — for
            example business assets, a property trust, inheritance-tax planning, or
            blended families with competing claims. If that sounds like you, our
            experts can help — get in touch for a consultation.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/eligibility" className="btn-secondary">
              Start the eligibility check
            </Link>
            <Link href="/consultation?source=landing" className="btn-primary">
              Get in touch for an expert consultation
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
