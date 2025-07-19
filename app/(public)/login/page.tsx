"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [magicLinkLoading, setMagicLinkLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle magic link authentication on component mount
  useEffect(() => {
    const token = searchParams?.get("token");
    if (token) {
      handleMagicLinkAuth(token);
    }
  }, [searchParams]);

  const handleMagicLinkAuth = async (token: string) => {
    setMagicLinkLoading(true);
    try {
      const response = await fetch("/api/auth/magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Welcome back, ${data.user.name}! Redirecting to your portal...`);
        
        // Small delay to ensure cookie is set, then force a refresh before redirect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force a page refresh to ensure session is picked up
        if (data.portalId) {
          window.location.href = `/portal/${data.portalId}`;
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Invalid or expired magic link");
        
        // Clear the token from URL to show the regular login form
        const url = new URL(window.location.href);
        url.searchParams.delete("token");
        window.history.replaceState({}, "", url.toString());
      }
    } catch (error) {
      console.error("Magic link authentication error:", error);
      toast.error("Authentication failed. Please try logging in manually.");
      
      // Clear the token from URL to show the regular login form
      const url = new URL(window.location.href);
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
    } finally {
      setMagicLinkLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    setLoading(false);
    if (res?.error) {
      console.log("🔍 Login error received:", res.error);
      
      // Check if error is about email verification
      if (res.error.includes("verify your email")) {
        console.log("✅ Email verification error detected, sending OTP...");
        toast.info("Sending verification code to your email...");
        
        try {
          // Send OTP automatically
          console.log("📧 Calling send-otp API for email:", email);
          const otpResponse = await fetch("/api/auth/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });
          
          console.log("📊 OTP Response status:", otpResponse.status);
          console.log("📊 OTP Response ok:", otpResponse.ok);
          
          if (otpResponse.ok) {
            const otpData = await otpResponse.json();
            console.log("📊 OTP Response data:", otpData);
            toast.success("A verification code has been sent to your email. Please verify to continue.");
            // Redirect to OTP screen with login source
            router.push(`/otp?email=${encodeURIComponent(email)}&source=login`);
          } else {
            const errorData = await otpResponse.json();
            console.log("❌ OTP Response error:", errorData);
            toast.error("Failed to send verification code. Please try again.");
          }
        } catch (error) {
          console.log("❌ OTP Request failed:", error);
          toast.error("Failed to send verification code. Please try again.");
        }
      } else {
        console.log("❌ Other login error:", res.error);
        toast.error("Invalid email or password");
      }
    } else {
      toast.success("Login successful!");
      router.push("/dashboard");
    }
  };

  // Show magic link processing screen
  if (magicLinkLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Authenticating...</h2>
          <p className="text-gray-600">Please wait while we verify your access link.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">Login to your account</h2>
        <div className="flex items-center gap-2 text-gray-700 text-base">
          <span>Don't have an account?</span>
          <Link href="/signup" className="text-black font-bold hover:underline">Sign Up</Link>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 mb-6 border-gray-300 cursor-pointer"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <img src="/google.svg" alt="Google" className="w-5 h-5" />
        Sign in with Google
      </Button>
      <div className="flex items-center my-4">
        <div className="flex-1 h-px bg-gray-300" />
        <span className="mx-4 text-gray-500 font-medium">OR</span>
        <div className="flex-1 h-px bg-gray-300" />
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label htmlFor="email" className="font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <div className="flex justify-between items-center">
            <Label htmlFor="password" className="font-medium">Password</Label>
            <Link href="/forgot-password" className="text-gray-500 text-sm hover:underline">Forgot Password?</Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="mt-1 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowPassword(v => !v)}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div className="flex items-center">
          <input
            id="remember"
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
            className="mr-2"
          />
          <Label htmlFor="remember" className="text-gray-700">Remember me</Label>
        </div>
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-3 rounded-md cursor-pointer" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>
    </>
  );
} 