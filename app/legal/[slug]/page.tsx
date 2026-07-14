'use client';

import { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Mail,
  Clock,
  Send,
  Shield,
  FileText,
  Cookie,
  AlertTriangle,
  MessageSquare,
  User,
  AtSign,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

const VALID_SLUGS = ['contact', 'privacy', 'terms', 'cookies', 'disclaimer'];

// ===== PAGE ICON =====
function PageIcon({ slug }: { slug: string }) {
  const iconMap = {
    contact: { Icon: MessageSquare, gradient: 'from-blue-500/20 to-cyan-500/20' },
    privacy: { Icon: Shield, gradient: 'from-emerald-500/20 to-teal-500/20' },
    terms: { Icon: FileText, gradient: 'from-purple-500/20 to-violet-500/20' },
    cookies: { Icon: Cookie, gradient: 'from-amber-500/20 to-orange-500/20' },
    disclaimer: { Icon: AlertTriangle, gradient: 'from-rose-500/20 to-red-500/20' },
  };

  const config = iconMap[slug as keyof typeof iconMap] || iconMap.terms;
  const IconComponent = config.Icon;

  return (
    <div className={cn(
      "w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br",
      config.gradient,
      "border border-border/50 shadow-lg"
    )}>
      <IconComponent className="w-7 h-7 text-primary" />
    </div>
  );
}

// ===== SECTION CARD - Works with flat structure =====
function SectionCard({
  title,
  content,
  items = [],
  index,
  isRTL,
}: {
  title: string;
  content?: string;
  items?: string[];
  index: number;
  isRTL: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className={cn(
        "flex items-start gap-4",
        isRTL && "flex-row-reverse"
      )}>
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-xs font-bold text-primary">{String(index).padStart(2, '0')}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-lg font-semibold text-foreground mb-2",
            isRTL && "text-right"
          )}>{title}</h3>
          {content && (
            <p className={cn(
              "text-muted-foreground leading-relaxed text-sm",
              isRTL && "text-right"
            )}>{content}</p>
          )}
          {items && items.length > 0 && (
            <ul className={cn(
              "mt-3 space-y-1.5 text-sm text-muted-foreground",
              isRTL && "text-right"
            )}>
              {items.map((item, idx) => (
                <li key={idx} className={cn(
                  "leading-relaxed",
                  isRTL ? "pr-4" : "pl-4"
                )}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ===== CONTACT INFO CARD =====
function ContactInfoCard({
  Icon,
  label,
  value,
  isRTL,
}: {
  Icon: React.ElementType;
  label: string;
  value: string;
  isRTL: boolean;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className={cn(
        "flex items-center gap-3 mb-2",
        isRTL && "flex-row-reverse"
      )}>
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</h3>
      </div>
      <p className={cn(
        "text-foreground font-medium text-sm break-all",
        isRTL ? "pr-12 text-right" : "pl-12"
      )}>{value}</p>
    </div>
  );
}

// ===== SUCCESS POPUP =====
function SuccessPopup({ onClose, isRTL }: { onClose: () => void; isRTL: boolean }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-card border border-border rounded-2xl max-w-md w-full p-8 shadow-2xl relative">
          <button
            onClick={onClose}
            className={cn(
              "absolute top-4 text-muted-foreground hover:text-foreground transition-colors",
              isRTL ? "left-4" : "right-4"
            )}
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <svg className="w-12 h-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Message Sent!</h2>
            <p className="text-muted-foreground mb-6">
              Your message has been sent successfully. We'll get back to you as soon as possible.
            </p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ===== SVG SOCIAL ICONS =====
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

// ===== MAIN PAGE =====
export default function LegalPage({ params }: { params: Promise<{ slug: string }> }) {
  // ✅ CORRECT: Unwrap params using React.use()
  const { slug } = use(params);

  // ✅ CORRECT: Also unwrap searchParams if you had them
  // const searchParams = use(searchParamsProp);

  if (!VALID_SLUGS.includes(slug)) {
    notFound();
  }

  // Get translations
  const { t, language } = useTranslation();
  const isRTL = language === 'ar';

  // Apply RTL/LTR to document root
  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    if (isRTL) {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [isRTL]);

  // Get page data from i18n
  const pageData = (t.legal?.pages as any)?.[slug];

  // If no data found, show 404
  if (!pageData) {
    notFound();
  }

  const [showPopup, setShowPopup] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPopup(true);
    setFormData({ name: '', email: '', message: '' });
  };

  const socialIcons = [
    { Icon: FacebookIcon, label: 'Facebook' },
    { Icon: TwitterIcon, label: 'Twitter' },
    { Icon: LinkedInIcon, label: 'LinkedIn' },
    { Icon: GithubIcon, label: 'GitHub' },
  ];

  // ===== CONTACT PAGE =====
  if (slug === 'contact') {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link href="/" className={cn(
          "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group w-fit",
          isRTL && "flex-row-reverse"
        )}>
          <ArrowLeft className={cn(
            "w-4 h-4 transition-transform group-hover:-translate-x-1",
            isRTL && "rotate-180 group-hover:translate-x-1"
          )} />
          <span className="text-sm font-medium">{t.page404?.backHome || 'Back to Home'}</span>
        </Link>

        <div className="space-y-4 mb-10">
          <div className={cn(
            "flex items-center gap-4",
            isRTL && "flex-row-reverse"
          )}>
            <PageIcon slug={slug} />
            <div>
              <h1 className={cn(
                "text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground",
                isRTL && "text-right"
              )}>
                {pageData.title}
              </h1>
              <p className={cn(
                "text-muted-foreground text-base sm:text-lg max-w-2xl mt-1",
                isRTL && "text-right"
              )}>
                {pageData.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-8">
          <p className={cn(
            "text-muted-foreground",
            isRTL && "text-right"
          )}>{pageData.description}</p>
        </div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <ContactInfoCard Icon={Mail} label={pageData.email} value={pageData.emailValue} isRTL={isRTL} />
          <ContactInfoCard Icon={Clock} label={pageData.responseTime} value={pageData.responseTimeValue} isRTL={isRTL} />
        </div>

        {/* Additional Info */}
        {pageData.additionalInfo && (
          <div className="bg-muted/50 border border-border rounded-2xl p-6 mb-8">
            <p className={cn(
              "text-muted-foreground text-sm",
              isRTL && "text-right"
            )}>{pageData.additionalInfo}</p>
          </div>
        )}

        {/* Social Section */}
        <div className="bg-card border border-border rounded-2xl p-6 text-center mb-8">
          <h3 className={cn(
            "text-lg font-semibold text-foreground mb-2",
            isRTL && "text-right"
          )}>{pageData.socialTitle}</h3>
          <p className={cn(
            "text-muted-foreground text-sm mb-4",
            isRTL && "text-right"
          )}>{pageData.socialDescription}</p>
          <div className={cn(
            "flex items-center justify-center gap-3",
            isRTL && "flex-row-reverse"
          )}>
            {socialIcons.map((social, idx) => {
              const SocialIcon = social.Icon;
              return (
                <button
                  key={idx}
                  className="w-10 h-10 rounded-xl bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all duration-300 flex items-center justify-center"
                  aria-label={social.label}
                >
                  <SocialIcon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={cn(
                  "block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2",
                  isRTL && "flex-row-reverse justify-end"
                )}>
                  <User className="w-4 h-4 text-muted-foreground" />
                  {pageData.formName}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder={pageData.formName}
                />
              </div>
              <div>
                <label className={cn(
                  "block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2",
                  isRTL && "flex-row-reverse justify-end"
                )}>
                  <AtSign className="w-4 h-4 text-muted-foreground" />
                  {pageData.formEmail}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder={pageData.formEmail}
                />
              </div>
            </div>
            <div>
              <label className={cn(
                "block text-sm font-medium text-foreground mb-1.5 flex items-center gap-2",
                isRTL && "flex-row-reverse justify-end"
              )}>
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                {pageData.formMessage}
              </label>
              <textarea
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                required
                className="w-full bg-muted border border-border rounded-xl py-2.5 px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all resize-none"
                placeholder={pageData.formMessage}
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 group"
            >
              <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              {pageData.formSubmit}
            </button>
          </form>
        </div>

        {showPopup && <SuccessPopup onClose={() => setShowPopup(false)} isRTL={isRTL} />}
      </div>
    );
  }

  // ===== LEGAL PAGES (privacy, terms, cookies, disclaimer) =====
  // Get all section keys (section1, section2, etc.)
  const sectionKeys = Object.keys(pageData)
    .filter(key => key.startsWith('section') && /^section\d+$/.test(key))
    .sort((a, b) => {
      const numA = parseInt(a.replace('section', ''));
      const numB = parseInt(b.replace('section', ''));
      return numA - numB;
    });

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link href="/" className={cn(
        "inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8 group w-fit",
        isRTL && "flex-row-reverse"
      )}>
        <ArrowLeft className={cn(
          "w-4 h-4 transition-transform group-hover:-translate-x-1",
          isRTL && "rotate-180 group-hover:translate-x-1"
        )} />
        <span className="text-sm font-medium">{t.page404?.backHome || 'Back to Home'}</span>
      </Link>

      <div className="space-y-4 mb-10">
        <div className={cn(
          "flex items-center gap-4",
          isRTL && "flex-row-reverse"
        )}>
          <PageIcon slug={slug} />
          <div>
            <h1 className={cn(
              "text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground",
              isRTL && "text-right"
            )}>
              {pageData.title}
            </h1>
            <p className={cn(
              "text-muted-foreground text-base sm:text-lg max-w-2xl mt-1",
              isRTL && "text-right"
            )}>
              {pageData.subtitle}
            </p>
          </div>
        </div>
        {pageData.lastUpdated && (
          <div className={cn(
            "text-sm text-muted-foreground/70 border-b border-border pb-4 flex items-center gap-2",
            isRTL && "flex-row-reverse justify-end"
          )}>
            <Clock className="w-3.5 h-3.5" />
            {pageData.lastUpdated}
          </div>
        )}
      </div>

      {pageData.introduction && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <p className={cn(
            "text-muted-foreground",
            isRTL && "text-right"
          )}>{pageData.introduction}</p>
        </div>
      )}

      <div className="space-y-4">
        {sectionKeys.map((sectionKey, index) => {
          const section = pageData[sectionKey];
          
          // Collect all items for this section (section1a, section1b, etc.)
          const items: string[] = [];
          let itemIndex = 1;
          while (true) {
            const itemKey = `${sectionKey}${String.fromCharCode(96 + itemIndex)}`; // section1a, section1b, etc.
            if (pageData[itemKey]) {
              items.push(pageData[itemKey]);
              itemIndex++;
            } else {
              break;
            }
          }
          
          return (
            <SectionCard
              key={sectionKey}
              title={section?.title || ''}
              content={section?.content || ''}
              items={items}
              index={index + 1}
              isRTL={isRTL}
            />
          );
        })}
      </div>
    </div>
  );
}