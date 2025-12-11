"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, you can cancel your subscription at any time. You'll retain Pro access until the end of your billing period.",
  },
  {
    question: "Is there a free trial?",
    answer:
      "We offer a generous Free tier with 3 stacks and 7 days of history. Try it out before upgrading!",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards through our secure payment provider, Stripe.",
  },
  {
    question: "Can I switch between monthly and annual?",
    answer:
      "Yes, you can switch billing cycles anytime from your account settings.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 14-day money-back guarantee. Contact support if you're not satisfied.",
  },
];

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {FAQS.map((faq, index) => (
        <div
          key={index}
          className="border rounded-lg overflow-hidden"
        >
          <button
            onClick={() => toggleFAQ(index)}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">{faq.question}</span>
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${
                openIndex === index ? "rotate-180" : ""
              }`}
            />
          </button>
          {openIndex === index && (
            <div className="px-4 pb-4 text-muted-foreground">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
