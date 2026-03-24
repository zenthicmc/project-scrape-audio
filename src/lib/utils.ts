import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CREDITS_PER_GENERATION = parseInt(
  process.env.NEXT_PUBLIC_CREDITS_PER_GENERATION || "10"
);

export const CREDIT_PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    price: 49000,
    priceFormatted: "Rp 49.000",
    perGenFormatted: "Rp 4.900/script",
    popular: false,
    features: [
      "10 script generations",
      "Semua 7 gaya bahasa",
      "Rich text editor",
      "History 30 hari",
    ],
  },
  {
    id: "creator",
    name: "Creator",
    credits: 300,
    price: 129000,
    priceFormatted: "Rp 129.000",
    perGenFormatted: "Rp 4.300/script",
    popular: true,
    features: [
      "30 script generations",
      "Semua 7 gaya bahasa",
      "Rich text editor",
      "History unlimited",
      "Priority processing",
    ],
  },
  {
    id: "agency",
    name: "Agency",
    credits: 1000,
    price: 399000,
    priceFormatted: "Rp 399.000",
    perGenFormatted: "Rp 3.990/script",
    popular: false,
    features: [
      "100 script generations",
      "Semua 7 gaya bahasa",
      "Rich text editor",
      "History unlimited",
      "Priority processing",
      "Bulk generate",
    ],
  },
];

export const SCRIPT_STYLES = [
  { value: "ORIGINAL", label: "Original" },
  { value: "MIRIP_REFERENSI", label: "Mirip referensi" },
  { value: "STORY_TELLING", label: "Story telling" },
  { value: "SKEPTICAL_HOOK", label: "Skeptical hook" },
  { value: "FOKUS_BENEFIT", label: "Fokus benefit" },
  { value: "PAS", label: "PAS" },
  { value: "FOKUS_FITUR", label: "Fokus fitur" },
] as const;

export const NICHE_OPTIONS = [
  "Beauty & Skincare",
  "Fashion & Style",
  "Food & Kuliner",
  "Fitness & Kesehatan",
  "Travel & Lifestyle",
  "Tech & Gadget",
  "Finance & Investasi",
  "Bisnis & Entrepreneur",
  "Pendidikan & Tutorial",
  "Entertainment & Humor",
  "Parenting & Family",
  "Gaming",
  "Otomotif",
  "Property & Real Estate",
  "Lainnya",
];

export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
