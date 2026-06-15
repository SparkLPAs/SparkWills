"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ELIGIBILITY_QUESTIONS,
  CONSULTATION_SIGNPOST,
  JURISDICTION,
} from "@/lib/constants";

type Answers = Record<string, boolean | undefined>;

export default function EligibilityPage() {
  const [answers, setAnswers] = useState<Answers>({});

  const failed = ELIGIBILITY_QUESTIONS.filter(
    (q) => answers[q.id] !== undefined && answers[q.id] !== q.requiredAnswer,
  );
  const allAnswered = ELIGIBILITY_QUESTIONS.every(
    (q) => answers[q.id] !== undefined,
  );
  const passed = allAnswered && failed.length === 0;

  return (
    <div className="mx-auto max-w-2xl px-6 py-14">
      <p className="text-sm font-medium text-navy-600">Step 1 of 7 · Eligibility</p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-navy-900">
        Is a Protective Property Trust Will right for you?
      </h1>
      <p className="mt-3 text-navy-700">
        Answer these four questions about you and your partner. They confirm the
        structure suits your circumstances before you spend any time on it.
      </p>

      <div className="mt-8 space-y-4">
        {ELIGIBILITY_QUESTIONS.map((q, i) => {
          const value = answers[q.id];
          const isFail = value !== undefined && value !== q.requiredAnswer;
          return (
            <fieldset key={q.id} className="card p-5">
              <legend className="sr-only">{q.question}</legend>
              <div className="flex items-start justify-between gap-4">
                <p className="font-medium text-navy-800">
                  <span className="mr-2 text-navy-500">{i + 1}.</span>
                  {q.question}
                </p>
                <div className="flex shrink-0 gap-2">
                  {[true, false].map((opt) => (
                    <button
                      key={String(opt)}
                      type="button"
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [q.id]: opt }))
                      }
                      className={`rounded-md border px-4 py-1.5 text-sm font-semibold transition-colors ${
                        value === opt
                          ? "border-navy-800 bg-navy-800 text-cream-50"
                          : "border-navy-200 bg-white text-navy-700 hover:bg-cream-100"
                      }`}
                      aria-pressed={value === opt}
                    >
                      {opt ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
              {isFail && (
                <p className="mt-3 rounded-md bg-amber-50 p-3 text-sm text-navy-800">
                  {q.failMessage}
                </p>
              )}
            </fieldset>
          );
        })}
      </div>

      {/* Outcome */}
      {allAnswered && failed.length > 0 && (
        <div className="mt-8 rounded-lg border border-warning/40 bg-amber-50/60 p-5">
          <h2 className="font-serif text-lg font-semibold text-navy-900">
            This tool may not be the right fit
          </h2>
          <p className="mt-2 text-sm text-navy-700">
            Based on your answers, a DIY Protective Property Trust Will may not
            suit your circumstances. {CONSULTATION_SIGNPOST}
          </p>
          <Link href="/consultation?source=eligibility" className="btn-primary mt-4">
            Get in touch for an expert consultation
          </Link>
        </div>
      )}

      {passed && (
        <div className="mt-8 rounded-lg border border-success/40 bg-green-50/60 p-5">
          <h2 className="font-serif text-lg font-semibold text-navy-900">
            You&apos;re eligible to continue
          </h2>
          <p className="mt-2 text-sm text-navy-700">
            A Protective Property Trust Will looks like a good fit. Create an
            account to start the guided wizard — your progress saves as you go.
          </p>
          <Link href="/register" className="btn-primary mt-4">
            Create your account
          </Link>
        </div>
      )}

      <p className="mt-10 text-xs text-navy-500">
        {JURISDICTION} only. This eligibility check provides legal information,
        not legal advice.
      </p>
    </div>
  );
}
