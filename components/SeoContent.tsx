"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface SeoContentProps {
  pageKey: string;
  className?: string;
}

// FAQ Item Component inside SeoContent
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useTranslation();
  const isRTL = language === "ar";

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between py-4 px-2 text-left hover:bg-muted/50 transition-colors rounded-lg",
          isRTL && "text-right"
        )}
      >
        <span className="font-medium text-foreground">{question}</span>
        {isOpen ? (
          <ChevronUp className={cn(
            "w-5 h-5 text-muted-foreground shrink-0",
            isRTL ? "mr-4" : "ml-4"
          )} />
        ) : (
          <ChevronDown className={cn(
            "w-5 h-5 text-muted-foreground shrink-0",
            isRTL ? "mr-4" : "ml-4"
          )} />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className={cn(
              "pb-4 px-2 text-muted-foreground leading-relaxed",
              isRTL && "text-right"
            )}>
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function SeoContent({ pageKey, className }: SeoContentProps) {
  const { t, language } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);
  const isRTL = language === "ar";

  const content = (t.seo as any)?.[pageKey];
  if (!content || !Array.isArray(content) || content.length === 0) {
    return null;
  }

  const toggleReadMore = () => {
    setIsExpanded(!isExpanded);
  };

  const renderContent = (items: any[]) => {
    return items.map((item, index) => {
      // Handle FAQ type
      if (item.type === "faq" && item.items) {
        return (
          <div key={index} className="mt-8">
            <h2 className={cn(
              "text-2xl font-display font-bold text-foreground mb-6",
              isRTL && "text-right"
            )}>
              {isRTL ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
            </h2>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {item.items.map((faq: { question: string; answer: string }, faqIndex: number) => (
                <FAQItem
                  key={faqIndex}
                  question={faq.question}
                  answer={faq.answer}
                />
              ))}
            </div>
          </div>
        );
      }

      // Handle regular content types
      switch (item.type) {
        case "h1":
          return (
            <h1 key={index} className={cn(
              "text-3xl sm:text-4xl font-display font-bold text-foreground mt-8 mb-4",
              isRTL && "text-right"
            )}>
              {item.text}
            </h1>
          );
        case "h2":
          return (
            <h2 key={index} className={cn(
              "text-2xl sm:text-3xl font-display font-semibold text-foreground mt-6 mb-3",
              isRTL && "text-right"
            )}>
              {item.text}
            </h2>
          );
        case "h3":
          return (
            <h3 key={index} className={cn(
              "text-xl sm:text-2xl font-display font-medium text-foreground mt-5 mb-2",
              isRTL && "text-right"
            )}>
              {item.text}
            </h3>
          );
        case "p":
          return (
            <p key={index} className={cn(
              "text-muted-foreground text-base sm:text-lg leading-relaxed mb-4",
              isRTL && "text-right"
            )}>
              {item.text}
            </p>
          );
        case "ul":
          return (
            <ul key={index} className={cn(
              "text-muted-foreground text-base sm:text-lg leading-relaxed mb-4 space-y-1",
              isRTL ? "list-disc list-inside [&>li]:text-right" : "list-disc list-inside"
            )}>
              {item.items?.map((li: string, liIndex: number) => (
                <li key={liIndex}>{li}</li>
              ))}
            </ul>
          );
        case "ol":
          return (
            <ol key={index} className={cn(
              "text-muted-foreground text-base sm:text-lg leading-relaxed mb-4 space-y-1",
              isRTL ? "list-decimal list-inside [&>li]:text-right" : "list-decimal list-inside"
            )}>
              {item.items?.map((li: string, liIndex: number) => (
                <li key={liIndex}>{li}</li>
              ))}
            </ol>
          );
        default:
          return null;
      }
    });
  };

  const visibleContent = isExpanded ? content : content.slice(0, 3);

  return (
    <div className={cn(
      "w-full max-w-3xl mx-auto",
      isRTL ? "text-right" : "text-left",
      className
    )}>
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {renderContent(visibleContent)}
      </div>

      {content.length > 3 && (
        <button
          onClick={toggleReadMore}
          className={cn(
            "mt-6 px-6 py-3 rounded-full bg-muted hover:bg-muted/80 text-foreground font-medium transition-all duration-300 flex items-center gap-2 mx-auto",
            isRTL && "flex-row-reverse"
          )}
        >
          {isExpanded ? (
            <>
              {isRTL ? "قراءة أقل" : "Read Less"}
              <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              {isRTL ? "قراءة المزيد" : "Read More"}
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      )}
    </div>
  );
}