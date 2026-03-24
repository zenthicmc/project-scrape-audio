"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Zap, CheckCircle, Loader2, CreditCard, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { CREDIT_PACKAGES, formatDate } from "@/lib/utils";

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

function BillingContent() {
  const searchParams = useSearchParams();
  const paymentStatus = searchParams.get("payment");

  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingPackage, setBuyingPackage] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);

  useEffect(() => {
    // Load Midtrans Snap.js
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

    return () => { document.head.removeChild(script); };
  }, []);

  useEffect(() => {
    fetch("/api/credits")
      .then(res => res.json())
      .then(data => {
        setBalance(data.balance);
        setTransactions(data.transactions || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (packageId: string) => {
    setBuyingPackage(packageId);
    try {
      const res = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Terjadi kesalahan.");
        return;
      }

      if (window.snap && data.snapToken) {
        window.snap.pay(data.snapToken, {
          onSuccess: () => {
            window.location.href = "/dashboard/billing?payment=success";
          },
          onPending: () => {
            window.location.href = "/dashboard/billing?payment=pending";
          },
          onError: () => {
            window.location.href = "/dashboard/billing?payment=error";
          },
          onClose: () => {
            setBuyingPackage(null);
          },
        });
      } else {
        alert("Midtrans Snap belum siap. Coba lagi.");
      }
    } catch {
      alert("Terjadi kesalahan. Coba lagi.");
    } finally {
      setBuyingPackage(null);
    }
  };

  const getTxIcon = (type: string, amount: number) => {
    if (type === "TOPUP" || type === "BONUS" || type === "REFUND") {
      return <ArrowUpRight className="w-4 h-4 text-green-400" />;
    }
    return <ArrowDownRight className="w-4 h-4 text-destructive" />;
  };

  const getTxColor = (type: string) => {
    if (type === "TOPUP" || type === "BONUS" || type === "REFUND") return "text-green-400";
    return "text-destructive";
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Billing & Credits</h1>
        <p className="text-sm text-muted-foreground">Kelola kredit dan riwayat pembayaran</p>
      </div>

      {/* Payment status banner */}
      {paymentStatus === "success" && (
        <div className="flex items-center gap-2 p-4 bg-green-500/10 border border-green-500/20 rounded-xl mb-6">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-sm text-green-400 font-medium">Pembayaran berhasil! Kredit telah ditambahkan ke akun Anda.</p>
        </div>
      )}
      {paymentStatus === "pending" && (
        <div className="flex items-center gap-2 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl mb-6">
          <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
          <p className="text-sm text-yellow-400 font-medium">Pembayaran sedang diproses. Kredit akan ditambahkan setelah konfirmasi.</p>
        </div>
      )}
      {paymentStatus === "error" && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 border border-destructive/20 rounded-xl mb-6">
          <p className="text-sm text-destructive font-medium">Pembayaran gagal. Silakan coba lagi.</p>
        </div>
      )}

      {/* Credit balance */}
      <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Zap className="w-6 h-6 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Saldo Kredit</p>
            <p className="text-4xl font-black text-primary">
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : balance ?? 0}
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span>1 generate = 10 credits</span>
          </div>
          <span>·</span>
          <span>Credits tidak expired</span>
        </div>
      </div>

      {/* Credit packages */}
      <h2 className="font-semibold mb-4">Top Up Credits</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {CREDIT_PACKAGES.map(pkg => (
          <div
            key={pkg.id}
            className={`relative bg-card border rounded-2xl p-5 transition-all ${pkg.popular ? "border-primary ring-1 ring-primary/30" : "border-border hover:border-primary/40"}`}
          >
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-primary text-white text-xs font-semibold rounded-full">Populer</span>
              </div>
            )}
            <h3 className="font-bold mb-1">{pkg.name}</h3>
            <div className="text-2xl font-black mb-1">{pkg.priceFormatted}</div>
            <p className="text-xs text-muted-foreground mb-1">{pkg.credits} credits</p>
            <p className="text-xs text-primary mb-4">{pkg.perGenFormatted}</p>
            <ul className="space-y-1.5 mb-4">
              {pkg.features.map((f, i) => (
                <li key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleBuy(pkg.id)}
              disabled={!!buyingPackage || !snapLoaded}
              className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${pkg.popular ? "bg-primary text-white hover:bg-primary/90" : "border border-border hover:bg-secondary"}`}
            >
              {buyingPackage === pkg.id ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Beli {pkg.name}</>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      <h2 className="font-semibold mb-4">Riwayat Transaksi</h2>
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-10 text-sm text-muted-foreground">Belum ada transaksi</div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {transactions.map((tx, i) => (
            <div key={tx.id} className={`flex items-center justify-between p-4 ${i < transactions.length - 1 ? "border-b border-border" : ""}`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  {getTxIcon(tx.type, tx.amount)}
                </div>
                <div>
                  <p className="text-sm font-medium">{tx.description || tx.type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(tx.createdAt)}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${getTxColor(tx.type)}`}>
                {tx.amount > 0 ? "+" : ""}{tx.amount} credits
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
