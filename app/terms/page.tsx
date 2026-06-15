import { DISCLAIMER } from "@/lib/constants";

export const metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-prose px-6 py-14">
      <h1 className="font-serif text-3xl font-bold text-navy-900">Terms of Service</h1>
      <p className="mt-2 text-sm text-navy-500">Placeholder — to be finalised before launch.</p>

      <div className="mt-6 space-y-4 text-navy-700">
        <h2 className="font-serif text-xl font-semibold text-navy-900">What this service is</h2>
        <p>
          We provide legal information and document templates for Protective
          Property Trust Wills in England &amp; Wales. We are not solicitors and do
          not provide legal advice or a solicitor service.
        </p>
        <h2 className="font-serif text-xl font-semibold text-navy-900">Your responsibilities</h2>
        <p>
          You are responsible for the accuracy of the information you enter and for
          executing your will correctly (signing and witnessing). We strongly
          recommend a solicitor reviews your documents before you execute them.
        </p>
        <h2 className="font-serif text-xl font-semibold text-navy-900">Limitation of liability</h2>
        <p>
          We do not accept liability for any loss arising from use of documents
          produced by this application, to the fullest extent permitted by law.
        </p>
        <p className="rounded-md bg-cream-100 p-4 text-sm">{DISCLAIMER}</p>
      </div>
    </article>
  );
}
