"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { z } from "zod";
import { useRouter } from "next/navigation";

const otpSchema = z.object({
  otp: z
    .string()
    .min(5, "OTP must be at least 5 digits")
    .max(6, "OTP must be at most 6 digits")
    .regex(/^\d+$/, "OTP must be numeric"),
});

type OtpInput = z.infer<typeof otpSchema>;

export default function OtpPage() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    setEmail(emailParam);
    if (emailParam) {
      localStorage.setItem("pendingEmail", emailParam);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, max 6 digits
    const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
    setOtp(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = otpSchema.safeParse({ otp });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (!email) {
      toast.error("Email is missing. Please try again.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (res.ok) {
        toast.success("OTP has been verified successfully.");
        setOtp("");
        // Route to reset-password with email in URL
        router.push(`/reset-password?email=${encodeURIComponent(email)}`);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to verify OTP");
      }
    } catch (err) {
      toast.error("Failed to verify OTP. Please try again.");
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("Email is required to resend OTP.");
      return;
    }
    setResending(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        toast.success("A new 6-digit verification code has been sent to your email.");
      } else {
        toast.error("Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      toast.error("Failed to resend OTP. Please try again.");
    }
    setResending(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex w-full max-w-5xl shadow-lg rounded-lg overflow-hidden">
        {/* Right Card (Branding) */}
        <div className="hidden md:flex flex-col justify-center items-start bg-black text-white w-1/2 p-12">
          <h1 className="text-5xl font-bold mb-4 text-left">Clientlane</h1>
          <p className="text-2xl font-light text-left">Everything your client needs<br/>in one portal.</p>
        </div>
        {/* Left Card (OTP Form) */}
        <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-2">Enter OTP</h2>
            <div className="flex items-center gap-2 text-gray-700 text-base">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                className="text-black font-bold hover:underline cursor-pointer"
                onClick={handleResend}
                disabled={resending || !email}
              >
                {resending ? "Resending..." : "Resend OTP"}
              </button>
            </div>
            {!email && <div className="text-red-500 text-sm mt-2">Email is required in the URL to resend OTP.</div>}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="otp" className="font-medium">OTP</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={otp}
                onChange={handleChange}
                className="mt-1 tracking-widest text-center text-lg"
                placeholder="Enter 6-digit code"
                minLength={5}
                maxLength={6}
              />
            </div>
            <Button type="submit" className="w-full bg-black text-white font-semibold text-lg py-3 rounded-md" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 