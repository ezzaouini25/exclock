'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion } from 'motion/react';
import { useTranslation } from '@/lib/i18n';
import { useParams, useRouter } from 'next/navigation';
import { Calendar, Share2, ArrowLeft, Copy, X } from 'lucide-react';
import Link from 'next/link';
import Loading from '@/app/loading';

// ===== TYPE DEFINITIONS =====
interface EventData {
  name: string;
  date: string;
  category?: string;
  color?: string;
  icon?: string;
  popularity?: number;
}

interface EventsData {
  [key: string]: EventData;
}

// ===== MAIN PAGE CONTENT (wrapped in Suspense) =====
function CountdownEventPageContent() {
  const { t, language } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  const getHref = (path: string) => language === 'en' ? path : `/${language}${path}`;

  // ============================================================
  // GET EVENT DATA FROM TRANSLATIONS
  // ============================================================
  const getEventData = () => {
    // First, check if this slug exists in the events translation data
    const eventsData = (t.countdown?.events || {}) as EventsData;
    
    // If the slug exists in the translation data, use it
    if (eventsData[slug]) {
      const event = eventsData[slug];
      return {
        name: event.name,
        date: event.date
      };
    }
    
    // Check if it's our custom format: name_timestamp
    const match = slug.match(/^(.*)_(\d+)$/);
    if (match) {
      const namePart = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const timestamp = parseInt(match[2], 10);
      return {
        name: namePart,
        date: new Date(timestamp).toISOString()
      };
    }
    
    // Fallback: try to find by matching name in translations
    const matchingEvent = Object.entries(eventsData).find(([id, data]) => {
      const slugLower = slug.toLowerCase().replace(/-/g, ' ');
      const nameLower = data.name.toLowerCase();
      const idLower = id.toLowerCase();
      return idLower === slugLower || nameLower === slugLower;
    });
    
    if (matchingEvent) {
      const [id, data] = matchingEvent;
      return {
        name: data.name,
        date: data.date
      };
    }
    
    // Final fallback: use the slug as the name
    return { 
      name: slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      date: new Date(Date.now() + 86400000 * 30).toISOString()
    };
  };

  const event = getEventData();
  const targetDate = new Date(event.date).getTime();

  // ============================================================
  // COUNTDOWN TIMER
  // ============================================================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    router.push(getHref("/countdown"));
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="flex flex-col space-y-12 pb-12 w-full max-w-4xl mx-auto items-center justify-center min-h-[70vh] relative">
      {/* Back Arrow - Outside the card with more top spacing */}
      <Link 
        href={getHref("/countdown")} 
        className="absolute top-16 start-8 sm:top-20 sm:start-12 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors z-20"
        aria-label={t.countdown?.back || "Back"}
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline text-sm font-medium">{t.countdown?.back || "Back"}</span>
      </Link>
      
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="flex flex-col items-center justify-center text-center space-y-8 p-8 sm:p-12 bg-card border border-border rounded-[3rem] shadow-2xl relative overflow-hidden w-full"
      >
        {/* X Close Button - Inside the card */}
        <button
          onClick={handleClose}
          className="absolute top-4 end-4 sm:top-6 sm:end-6 p-2 rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200 hover:scale-110 z-20"
          aria-label={t.common?.close || "Close"}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Background Glow */}
        <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
        
        {/* Event Name */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-tight text-foreground relative z-10">
          {event.name}
        </h1>
        
        {/* Countdown Timer */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 w-full relative z-10 mt-8" dir="ltr">
          {[
            { label: t.countdown?.days || "Days", value: timeLeft.days },
            { label: t.countdown?.hrs || "Hrs", value: timeLeft.hours },
            { label: t.countdown?.min || "Min", value: timeLeft.minutes },
            { label: t.countdown?.sec || "Sec", value: timeLeft.seconds }
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center p-4 sm:p-6 bg-muted rounded-3xl border border-border">
              <span className="text-3xl sm:text-6xl font-mono font-bold text-primary tabular-nums">
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-muted-foreground font-medium mt-2 uppercase tracking-widest text-xs sm:text-sm">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Share Button */}
        <button
          onClick={handleCopy}
          className="mt-8 flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors shadow-lg relative z-10"
        >
          {copied ? (
            <>
              <Copy className="w-4 h-4" />
              {"Copied!"}
            </>
          ) : (
            <>
              <Share2 className="w-4 h-4" />
              {"Share"}
            </>
          )}
        </button>

        {/* Event Date - Optional additional info */}
        <div className="relative z-10 mt-4 text-sm text-muted-foreground flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span>
            {new Date(event.date).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </span>
        </div>
      </motion.div>
    </div>
  );
}

// ===== MAIN EXPORT WITH SUSPENSE =====
export default function CountdownEventPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CountdownEventPageContent />
    </Suspense>
  );
}