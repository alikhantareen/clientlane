"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        throw new Error("Failed to send OTP");
      }
      toast.success("A 6-digit code has been sent to your email.");
      router.push(`/otp?email=${encodeURIComponent(email)}&source=forgot-password`);
      setEmail("");
    } catch (error) {
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex w-full max-w-5xl shadow-lg rounded-lg overflow-hidden">
        {/* Right Card (Branding) */}
        <div className="hidden md:flex flex-col justify-center items-start bg-slate-900 text-white w-1/2 p-12">
          <h1 className="text-5xl font-bold mb-4 text-left">Clientlane</h1>
          <p className="text-2xl font-light text-left">Everything your client needs<br/>in one portal.</p>
        </div>
        {/* Left Card (Forgot Password Form) */}
        <div className="flex-1 bg-white p-8 md:p-16 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold mb-2">Forgot your password?</h2>
            <div className="flex items-center gap-2 text-gray-700 text-base">
              <span>Remembered your password?</span>
              <Link href="/login" className="text-black font-bold hover:underline">Login</Link>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email" className="font-medium">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 text-white font-semibold text-lg py-3 rounded-md cursor-pointer" disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 