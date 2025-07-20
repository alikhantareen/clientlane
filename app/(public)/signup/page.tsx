"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters")
  .max(32, "Password must be at most 32 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: passwordSchema,
  confirmPassword: z.string().min(8, "Confirm Password is required"),
  role: z.literal("freelancer"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterInput = z.infer<typeof registerSchema>;

export default function SignupPage() {
  const [form, setForm] = useState<RegisterInput>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "freelancer",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle OAuth errors
  useEffect(() => {
    const error = searchParams?.get("error");
    const hasOAuthParams = searchParams?.get("state") || searchParams?.get("code") || searchParams?.get("scope");
    
    // Clean up OAuth parameters if they exist (even without errors)
    if (hasOAuthParams) {
      const url = new URL(window.location.href);
      const paramsToRemove = ["error", "callbackUrl", "state", "code", "scope", "authuser", "prompt"];
      paramsToRemove.forEach(param => url.searchParams.delete(param));
      window.history.replaceState({}, "", url.toString());
    }
    
    if (error === "OAuthAccountNotLinked") {
      toast.error("This email is already associated with a password account. Please sign in with your password instead.", {
        duration: 5000,
        action: {
          label: "Go to Login",
          onClick: () => {
            router.push("/login");
          }
        }
      });
    }
  }, [searchParams, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      }),
    });
    setLoading(false);
    if (res.ok) {
      // Send OTP email after successful registration
      try {
        const otpRes = await fetch("/api/auth/send-otp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        });
        if (otpRes.ok) {
          toast.success("A 6-digit verification code has been sent to your email. Please enter it below to verify your account.", { duration: 7000 });
        } else {
          toast.error("Failed to send verification code email. Please use 'Resend OTP' on the next page.");
        }
      } catch (err) {
        toast.error("Failed to send verification code email. Please use 'Resend OTP' on the next page.");
      }
      router.push(`/otp?email=${encodeURIComponent(form.email)}&source=signup`);
      setForm({ name: "", email: "", password: "", confirmPassword: "", role: "freelancer" });
    } else {
      const data = await res.json();
      toast.error(data.error || "Registration failed");
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signIn("google", { 
        callbackUrl: "/dashboard",
        redirect: false 
      });
      
      if (result?.error) {
        if (result.error === "OAuthAccountNotLinked") {
          toast.error("This email is already associated with a password account. Please sign in with your password instead.");
        } else {
          toast.error("Google sign-in failed. Please try again.");
        }
      }
    } catch (error) {
      toast.error("Google sign-in failed. Please try again.");
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-semibold mb-2">Create your account</h2>
        <div className="flex items-center gap-2 text-gray-700 text-base">
          <span>Already have an account?</span>
          <Link href="/login" className="text-black font-bold hover:underline">Login</Link>
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full flex items-center justify-center gap-2 mb-6 border-gray-300 cursor-pointer"
        onClick={handleGoogleSignIn}
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
          <Label htmlFor="name" className="font-medium">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            required
            value={form.name}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="email" className="font-medium">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="password" className="font-medium">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
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
        <div>
          <Label htmlFor="confirmPassword" className="font-medium">Confirm Password</Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.confirmPassword}
              onChange={handleChange}
              className="mt-1 pr-10"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
              onClick={() => setShowConfirmPassword(v => !v)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <div>
          <Label htmlFor="role" className="font-medium">Role</Label>
          <select
            id="role"
            name="role"
            value={form.role}
            disabled
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 cursor-not-allowed"
          >
            <option value="freelancer">Freelancer</option>
          </select>
        </div>
        {success && <div className="text-green-600 text-sm">{success}</div>}
        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg py-3 rounded-md cursor-pointer" disabled={loading}>
          {loading ? "Registering..." : "Sign Up"}
        </Button>
      </form>
    </>
  );
} 