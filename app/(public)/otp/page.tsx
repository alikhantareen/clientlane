"use client";

import { useState, useEffect, useRef } from "react";
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
  const [source, setSource] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cooldown, setCooldown] = useState(0); // seconds left
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to get localStorage key for cooldown per email
  const getCooldownKey = (email: string | null) =>
    email ? `otp_resend_cooldown_${email}` : "otp_resend_cooldown";

  // On mount, restore cooldown from localStorage if present
  useEffect(() => {
    if (email) {
      const key = getCooldownKey(email);
      const until = localStorage.getItem(key);
      if (until) {
        const seconds = Math.floor((parseInt(until) - Date.now()) / 1000);
        if (seconds > 0) setCooldown(seconds);
      }
    }
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
    // eslint-disable-next-line
  }, [email]);

  // Start countdown if cooldown > 0
  useEffect(() => {
    if (cooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (email) localStorage.removeItem(getCooldownKey(email));
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (cooldownRef.current) clearInterval(cooldownRef.current);
      };
    }
  }, [cooldown, email]);

  useEffect(() => {
    const emailParam = searchParams?.get("email") || null;
    const sourceParam = searchParams?.get("source") || null;
    setEmail(emailParam);
    setSource(sourceParam);
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
        // Route based on source: signup goes to login, forgot-password goes to reset-password, login goes to dashboard
        if (source === "signup") {
          toast.success(
            "Account verified successfully! Please login with your credentials."
          );
          router.push("/login");
        } else if (source === "forgot-password") {
          router.push(`/reset-password?email=${encodeURIComponent(email)}`);
        } else if (source === "login") {
          toast.success(
            "Email verified successfully! You can now login to your account."
          );
          router.push("/login");
        } else {
          // Default to login for safety
          toast.success(
            "Account verified successfully! Please login with your credentials."
          );
          router.push("/login");
        }
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
        toast.success(
          "A new 6-digit verification code has been sent to your email."
        );
        // Start cooldown
        setCooldown(60);
        localStorage.setItem(
          getCooldownKey(email),
          (Date.now() + 60000).toString()
        );
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
        <div className="hidden md:flex flex-col justify-center items-start bg-slate-900 text-white w-1/2 p-12">
          <h1 className="text-5xl font-bold mb-4 text-left">Clientlane</h1>
          <p className="text-2xl font-light text-left">
            Everything your client needs
            <br />
            in one portal.
          </p>
        </div>
        {/* Left Card (OTP Form) */}
        <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-2">
              {source === "login" ? "Verify Your Email" : "Enter OTP"}
            </h2>
            <div className="flex items-center gap-2 text-gray-700 text-base">
              {source === "login" ? (
                <span>
                  We've sent a verification code to your email to complete the
                  login process.
                </span>
              ) : (
                <>
                  <span>Didn't receive the code?</span>
                  <button
                    type="button"
                    className="text-black font-bold hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleResend}
                    disabled={resending || !email || cooldown > 0}
                  >
                    {resending
                      ? "Resending..."
                      : cooldown > 0
                        ? `Resend OTP (${cooldown}s)`
                        : "Resend OTP"}
                  </button>
                </>
              )}
            </div>
            {source === "login" && (
              <div className="flex items-center gap-2 text-gray-700 text-base mt-2">
                <span>Didn't receive the code?</span>
                <button
                  type="button"
                  className="text-black font-bold hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleResend}
                  disabled={resending || !email || cooldown > 0}
                >
                  {resending
                    ? "Resending..."
                    : cooldown > 0
                      ? `Resend OTP (${cooldown}s)`
                      : "Resend OTP"}
                </button>
              </div>
            )}
            {!email && (
              <div className="text-red-500 text-sm mt-2">
                Email is required in the URL to resend OTP.
              </div>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="otp" className="font-medium">
                OTP
              </Label>
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
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-3 rounded-md cursor-pointer"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
