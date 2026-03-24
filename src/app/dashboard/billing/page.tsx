"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Zap, CheckCircle, Loader2, CreditCard, ArrowUpRight, ArrowDownRight,
  Calculator, Info
} from "lucide-react";
import {
  formatDate, formatCurrency,
  CREDITS_PER_THOUSAND_IDR, MIN_TOPUP_AMOUNT, MAX_TOPUP_AMOUNT,
  CREDITS_PER_GENERATION
} from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import Pagination from "@/components/ui/Pagination";

interface CreditTransaction {
  id: string;
  amount: number;
  type: "TOPUP" | "USAGE" | "REFUND" | "BONUS";
  description: string | null;
  createdAt: string;
}

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

// Quick amount presets for convenience
const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 200000, 500000];

function BillingContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");
  const { t, language } = useLanguage();

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [snapLoaded, setSnapLoaded] = useState(false);

  // Custom amount state
  const [rawInput, setRawInput] = useState("");
  const [amount, setAmount] = useState(0);
  const [amountError, setAmountError] = useState("");

  // Derived credit estimate
  const estimatedCredits = amount >= MIN_TOPUP_AMOUNT
    ? Math.floor((amount / 1000) * CREDITS_PER_THOUSAND_IDR)
    : 0;
  const estimatedGenerations = estimatedCredits > 0
    ? Math.floor(estimatedCredits / CREDITS_PER_GENERATION)
    : 0;

  // Load Midtrans Snap script
  useEffect(() => {
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true";
    const snapUrl = isProduction
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

    const script = document.createElement("script");
    script.src = snapUrl;
    script.setAttribute("data-client-key", clientKey);
    script.onload = () => setSnapLoaded(true);
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch { } };
  }, []);

  // Fetch balance and transactions
  useEffect(() => {
    fetch("/api/credits")
      .then(res => res.json())
      .then(data => {
        setBalance(data.balance);
        setTransactions(data.transactions || []);
      })
      .finally(() => setLoading(false));
  }, [paymentStatus]);

  // Handle raw IDR input with thousand separator
  const handleAmountInput = (val: string) => {
    // Strip non-numeric
    const numeric = val.replace(/\D/g, "");
    const num = parseInt(numeric || "0", 10);
    setRawInput(numeric ? num.toLocaleString("id-ID") : "");
    setAmount(num);
    setAmountError("");
  };

  const handleQuickAmount = (val: number) => {
    setRawInput(val.toLocaleString("id-ID"));
    setAmount(val);
    setAmountError("");
  };

  const validateAmount = (): boolean => {
    if (!amount || amount < MIN_TOPUP_AMOUNT) {
      setAmountError(
        language === "id"
          ? `Minimal top-up adalah ${formatCurrency(MIN_TOPUP_AMOUNT)}`
          : `Minimum top-up is ${formatCurrency(MIN_TOPUP_AMOUNT)}`
      );
      return false;
    }
    if (amount > MAX_TOPUP_AMOUNT) {
      setAmountError(
        language === "id"
          ? `Maksimal top-up adalah ${formatCurrency(MAX_TOPUP_AMOUNT)}`
          : `Maximum top-up is ${formatCurrency(MAX_TOPUP_AMOUNT)}`
      );
      return false;
    }
    return true;
  };

  const handleTopUp = async () => {
    if (!validateAmount()) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, credits: estimatedCredits }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || (language === "id" ? "Terjadi kesalahan." : "An error occurred."));
        return;
      }

      if (window.snap && data.snapToken) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => { window.location.href = "/dashboard/billing?payment=success"; },
          onPending: () => { window.location.href = "/dashboard/billing?payment=pending"; },
          onError: () => { window.location.href = "/dashboard/billing?payment=error"; },
          onClose: () => { setProcessing(false); },
        });
      } else {
        alert(language === "id" ? "Midtrans Snap belum siap. Coba lagi." : "Midtrans Snap not ready. Please try again.");
      }
    } catch {
      alert(language === "id" ? "Terjadi kesalahan server." : "Server error. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Pagination state
  const [txPage, setTxPage] = useState(1);
  const TX_PER_PAGE = 10;
  const totalTxPages = Math.max(1, Math.ceil(transactions.length / TX_PER_PAGE));
  const paginatedTransactions = useMemo(
    () => transactions.slice((txPage - 1) * TX_PER_PAGE, txPage * TX_PER_PAGE),
    [transactions, txPage]
  );

  const getTxIcon = (type: string) => {
    if (type === "TOPUP" || type === "BONUS" || type === "REFUND")
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    return <ArrowDownRight className="w-4 h-4 text-destructive" />;
  };

  const getTxColor = (type: string) => {
    if (type === "TOPUP" || type === "BONUS" || type === "REFUND") return "text-green-500";
    return "text-destructive";
  };

  const getTxLabel = (type: string) => {
    const labels: Record<string, { id: string; en: string }> = {
      TOPUP: { id: "Top Up", en: "Top Up" },
      USAGE: { id: "Penggunaan", en: "Usage" },
      REFUND: { id: "Refund", en: "Refund" },
      BONUS: { id: "Bonus", en: "Bonus" },
    };
    return language === "id" ? (labels[type]?.id ?? type) : (labels[type]?.en ?? type);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold">{t("dashboard.billing.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("dashboard.billing.subtitle")}</p>
      </div>

      {/* Payment status banners */}
      {paymentStatus === "success" && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6">
          <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            {language === "id"
              ? "Pembayaran berhasil! Credit sudah ditambahkan ke akun Anda."
              : "Payment successful! Credits have been added to your account."}
          </p>
        </div>
      )}
      {paymentStatus === "pending" && (
        <div className="flex items-center gap-2 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl mb-6">
          <Loader2 className="w-5 h-5 text-yellow-500 animate-spin shrink-0" />
          <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">
            {language === "id"
              ? "Pembayaran sedang diproses. Credit akan ditambahkan setelah konfirmasi."
              : "Payment is being processed. Credits will be added after confirmation."}
          </p>
        </div>
      )}
      {paymentStatus === "error" && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
          <Info className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-medium">
            {language === "id"
              ? "Pembayaran gagal. Silakan coba lagi."
              : "Payment failed. Please try again."}
          </p>
        </div>
      )}

      {/* Credit balance card */}
      <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-0.5">
                {language === "id" ? "Saldo Credit" : "Credit Balance"}
              </p>
              <p className="text-4xl font-black text-primary leading-none">
                {loading ? <Loader2 className="w-6 h-6 animate-spin inline" /> : (balance ?? 0).toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">credits</p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">
              {language === "id" ? "Setara dengan" : "Equivalent to"}
            </p>
            <p className="text-lg font-bold text-foreground">
              {balance != null ? Math.floor(balance / CREDITS_PER_GENERATION).toLocaleString("id-ID") : "—"}
            </p>
            <p className="text-xs text-muted-foreground">
              {language === "id" ? "script generations" : "script generations"}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-primary/10 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>⚡ {CREDITS_PER_GENERATION} credits / generate</span>
          <span>·</span>
          <span>
            {language === "id"
              ? `Rp 1.000 = ${CREDITS_PER_THOUSAND_IDR} credits`
              : `IDR 1,000 = ${CREDITS_PER_THOUSAND_IDR} credits`}
          </span>
          <span>·</span>
          <span>{language === "id" ? "Tidak ada masa kadaluarsa" : "No expiry"}</span>
        </div>
      </div>

      {/* Top-up form */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Calculator className="w-5 h-5 text-primary" />
          <h2 className="font-semibold">
            {language === "id" ? "Top Up Credit" : "Top Up Credits"}
          </h2>
        </div>

        {/* Quick amount buttons */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">
            {language === "id" ? "Pilih nominal cepat:" : "Quick amounts:"}
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_AMOUNTS.map(val => (
              <button
                key={val}
                onClick={() => handleQuickAmount(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${amount === val
                  ? "bg-primary text-white border-primary"
                  : "border-border hover:border-primary/50 hover:bg-secondary text-muted-foreground"
                  }`}
              >
                {formatCurrency(val)}
              </button>
            ))}
          </div>
        </div>

        {/* Custom amount input */}
        <div className="mb-4">
          <label className="text-sm font-medium mb-1.5 block">
            {language === "id" ? "Atau masukkan nominal (IDR)" : "Or enter custom amount (IDR)"}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={rawInput}
              onChange={e => handleAmountInput(e.target.value)}
              placeholder="0"
              className={`w-full bg-secondary border rounded-xl pl-10 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground ${amountError ? "border-destructive" : "border-border"
                }`}
            />
          </div>
          {amountError && (
            <p className="text-xs text-destructive mt-1">{amountError}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {language === "id"
              ? `Minimal ${formatCurrency(MIN_TOPUP_AMOUNT)}`
              : `Minimum ${formatCurrency(MIN_TOPUP_AMOUNT)}`}
          </p>
        </div>

        {/* Credit estimator */}
        {amount >= MIN_TOPUP_AMOUNT && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-5">
            <p className="text-xs text-muted-foreground mb-2 font-medium">
              {language === "id" ? "Estimasi yang Anda dapatkan:" : "You will receive:"}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xl font-black text-primary">
                  {estimatedCredits.toLocaleString("id-ID")} credits
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">
                  {"≈"} {estimatedGenerations.toLocaleString("id-ID")} {language === "id" ? "script" : "scripts"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top-up button */}
        <button
          onClick={handleTopUp}
          disabled={processing || !snapLoaded || amount < MIN_TOPUP_AMOUNT}
          className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {processing ? (
            <><Loader2 className="w-4 h-4 animate-spin" />
              {language === "id" ? "Memproses..." : "Processing..."}</>
          ) : !snapLoaded ? (
            <><Loader2 className="w-4 h-4 animate-spin" />
              {language === "id" ? "Memuat payment gateway..." : "Loading payment gateway..."}</>
          ) : (
            <><CreditCard className="w-4 h-4" />
              {language === "id"
                ? amount >= MIN_TOPUP_AMOUNT ? `Top Up ${formatCurrency(amount)}` : "Masukkan Nominal"
                : amount >= MIN_TOPUP_AMOUNT ? `Top Up ${formatCurrency(amount)}` : "Enter Amount"
              }</>
          )}
        </button>

        <p className="text-xs text-center text-muted-foreground mt-3">
          {language === "id"
            ? "Pembayaran aman via Midtrans · QRIS, Transfer Bank, Kartu Kredit"
            : "Secure payment via Midtrans · QRIS, Bank Transfer, Credit Card"}
        </p>
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="font-semibold mb-4">
          {language === "id" ? "Riwayat Transaksi" : "Transaction History"}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center">
            <CreditCard className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {language === "id" ? "Belum ada transaksi" : "No transactions yet"}
            </p>
          </div>
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              {paginatedTransactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between p-4 ${i < paginatedTransactions.length - 1 ? "border-b border-border" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                      {getTxIcon(tx.type)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {tx.description || getTxLabel(tx.type)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold tabular-nums ${getTxColor(tx.type)}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("id-ID")} credits
                  </span>
                </div>
              ))}
            </div>

            <Pagination
              page={txPage}
              totalPages={totalTxPages}
              onPageChange={setTxPage}
              totalItems={transactions.length}
              perPage={TX_PER_PAGE}
              language={language}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    }>
      <BillingContent />
    </Suspense>
  );
}
