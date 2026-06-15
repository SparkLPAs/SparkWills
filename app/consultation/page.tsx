import { Suspense } from "react";
import { ConsultationForm } from "@/components/consultation/ConsultationForm";

export const metadata = { title: "Expert consultation" };

export default function ConsultationPage({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <p className="text-sm font-medium text-navy-600">Expert consultation</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-navy-900">
        Speak to one of our experts
      </h1>
      <p className="mt-3 max-w-prose text-navy-700">
        If a DIY Protective Property Trust Will isn&apos;t quite right for your
        circumstances — or you&apos;d simply like reassurance before you proceed —
        our experts can talk it through with you and recommend the best way
        forward. Leave your details and we&apos;ll be in touch.
      </p>

      <div className="mt-8">
        <Suspense>
          <ConsultationForm source={searchParams.source} />
        </Suspense>
      </div>
    </div>
  );
}
