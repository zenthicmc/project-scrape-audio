"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMessage("Token tidak valid."); return; }

    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) { setStatus("success"); setMessage("Email berhasil diverifikasi!"); }
        else { setStatus("error"); setMessage(data.error || "Token tidak valid atau sudah expired."); }
      })
      .catch(() => { setStatus("error"); setMessage("Terjadi kesalahan. Coba lagi."); });
  }, [token]);

  return (
    <div className="w-full max-w-md">
      <div className="bg-card border border-border rounded-2xl p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Memverifikasi Email...</h2>
            <p className="text-muted-foreground text-sm">Mohon tunggu sebentar.</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <h2 className="text-xl font-bold mb-2">Email Terverifikasi!</h2>
            <p className="text-muted-foreground text-sm mb-6">{message} Sekarang Anda bisa masuk ke akun Anda.</p>
            <button onClick={() => router.push("/auth/login")} className="w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-all glow">
              Masuk Sekarang
            </button>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-bold mb-2">Verifikasi Gagal</h2>
            <p className="text-muted-foreground text-sm mb-6">{message}</p>
            <button onClick={() => router.push("/auth/login")} className="w-full py-3 border border-border rounded-xl font-semibold hover:bg-secondary transition-colors">
              Kembali ke Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md"><div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">Loading...</div></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
