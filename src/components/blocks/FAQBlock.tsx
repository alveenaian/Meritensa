import { Disclosure } from "@headlessui/react";
import { ChevronDown } from "lucide-react";
import Markdown from "markdown-to-jsx";
import type { FAQBlock as FAQBlockType } from "./types";

export function FAQBlock({ data }: { data: FAQBlockType["data"] }) {
  return (
    <div className="bg-white py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {(data.title || data.subtitle) && (
          <div className="text-center mb-12">
            {data.title && (
              <h2 className="text-3xl font-bold text-secondary-900 sm:text-4xl">
                {data.title}
              </h2>
            )}
            {data.subtitle && (
              <p className="mt-4 text-lg text-secondary-600">{data.subtitle}</p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {data.faqs.map((faq, i) => (
            <Disclosure key={i}>
              {({ open }) => (
                <div className="rounded-2xl border border-secondary-200 bg-white shadow-card transition-all duration-300 hover:shadow-card-hover hover:border-primary-200">
                  <Disclosure.Button className="flex w-full items-center justify-between px-6 py-5 text-left">
                    <span className="text-lg font-semibold text-secondary-900">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 text-primary-600 transition-transform duration-200 ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-6 pb-5">
                    <div className="prose prose-sm max-w-none text-secondary-600 prose-p:text-secondary-600 prose-a:text-primary-600">
                      <Markdown>{faq.answer}</Markdown>
                    </div>
                  </Disclosure.Panel>
                </div>
              )}
            </Disclosure>
          ))}
        </div>
      </div>
    </div>
  );
}
