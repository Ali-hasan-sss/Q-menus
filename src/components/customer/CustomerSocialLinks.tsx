"use client";

export type SocialLinksPayload = {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  snapchat?: string;
};

const LABELS: Record<
  keyof SocialLinksPayload,
  { ar: string; en: string }
> = {
  facebook: { ar: "فيسبوك", en: "Facebook" },
  instagram: { ar: "إنستغرام", en: "Instagram" },
  twitter: { ar: "X", en: "X" },
  tiktok: { ar: "تيك توك", en: "TikTok" },
  youtube: { ar: "يوتيوب", en: "YouTube" },
  snapchat: { ar: "سناب شات", en: "Snapchat" },
};

/** Digits only for wa.me (country code + national number, no +). */
function digitsForWaMe(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  if (d.length < 8) return null;
  return d;
}

function telHrefFromPhone(phone: string | null | undefined): string | null {
  if (!phone || !String(phone).trim()) return null;
  const trimmed = String(phone).trim().replace(/\s/g, "");
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  const withPlus = trimmed.startsWith("+") ? trimmed : `+${digits}`;
  return `tel:${withPlus}`;
}

function waHrefFromNumber(e164ish: string | null | undefined): string | null {
  if (!e164ish || !String(e164ish).trim()) return null;
  const d = digitsForWaMe(String(e164ish));
  if (!d) return null;
  return `https://wa.me/${d}`;
}

function SocialIcon({ type }: { type: keyof SocialLinksPayload }) {
  const common = "w-5 h-5";
  switch (type) {
    case "facebook":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      );
    case "twitter":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "tiktok":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case "snapchat":
      return (
        <svg className={common} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path
            fillRule="evenodd"
            d="M4.848 2.924A59.428 59.428 0 0112 2c3.732 0 7.286.643 10.05 1.924.5.25.85.723.95 1.259l.02.09 1.061 7.27a1 1 0 01-.75 1.056L19 15.5l-2.183 4.374a1 1 0 01-.894.553H8.077a1 1 0 01-.894-.553L5 15.5l-2.381-.896a1 1 0 01-.75-1.056l1.06-7.27.02-.09a2 2 0 01.95-1.259z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return null;
  }
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className || "w-5 h-5"} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/**
 * Floating strip above the order bar: call, WhatsApp (optional), then social URLs.
 * Does not affect menu content layout.
 */
export function CustomerSocialLinks({
  links,
  phone,
  customerWhatsApp,
  isRTL,
}: {
  links: SocialLinksPayload | Record<string, string> | null | undefined;
  phone?: string | null;
  customerWhatsApp?: string | null;
  isRTL: boolean;
}) {
  const telHref = telHrefFromPhone(phone ?? null);
  const waHref = waHrefFromNumber(customerWhatsApp ?? null);

  const entries =
    links && typeof links === "object"
      ? (Object.entries(links) as [keyof SocialLinksPayload, string][]).filter(
          ([, url]) => typeof url === "string" && url.trim().length > 0,
        )
      : [];

  const hasContact = Boolean(telHref || waHref);
  const hasSocial = entries.length > 0;

  if (!hasContact && !hasSocial) return null;

  return (
    <nav
      className="fixed left-1/2 -translate-x-1/2 z-[45] flex flex-nowrap items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-md border border-white/20 shadow-sm max-w-[min(100vw-1.5rem,28rem)] overflow-x-auto overscroll-x-contain"
      style={{
        bottom: "calc(5.75rem + env(safe-area-inset-bottom, 0px))",
      }}
      aria-label={isRTL ? "التواصل مع المطعم" : "Contact restaurant"}
    >
      {telHref && (
        <a
          href={telHref}
          title={isRTL ? "اتصال بالمطعم" : "Call restaurant"}
          className="flex-shrink-0 p-1.5 rounded-full text-white/95 hover:bg-white/20 transition-colors"
        >
          <PhoneIcon />
          <span className="sr-only">{isRTL ? "اتصال" : "Call"}</span>
        </a>
      )}
      {waHref && (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          title={isRTL ? "مراسلة على واتساب" : "Message on WhatsApp"}
          className="flex-shrink-0 p-1.5 rounded-full text-white/95 hover:bg-emerald-500/40 transition-colors"
        >
          <WhatsAppIcon />
          <span className="sr-only">{isRTL ? "واتساب" : "WhatsApp"}</span>
        </a>
      )}
      {hasContact && hasSocial && (
        <div
          className="w-px h-6 bg-white/30 flex-shrink-0 mx-0.5"
          aria-hidden
        />
      )}
      {entries.map(([key, url]) => {
        const label = LABELS[key];
        if (!label) return null;
        return (
          <a
            key={key}
            href={url.trim()}
            target="_blank"
            rel="noopener noreferrer"
            title={isRTL ? label.ar : label.en}
            className="flex-shrink-0 p-1.5 rounded-full text-white/95 hover:bg-white/20 hover:text-white transition-colors"
          >
            <SocialIcon type={key} />
            <span className="sr-only">{isRTL ? label.ar : label.en}</span>
          </a>
        );
      })}
    </nav>
  );
}
