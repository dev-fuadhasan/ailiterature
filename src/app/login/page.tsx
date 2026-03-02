"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const supabase = createClient();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Check for error from callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get("error");
    if (errorParam) {
      const errorMessages: Record<string, string> = {
        auth_failed: "Authentication failed. Please try again.",
        no_code: "No authorization code received. Please try again.",
        session_error: "Failed to create session. Please try again.",
        no_user: "User data not received. Please try again.",
        unknown: "An unexpected error occurred. Please try again.",
      };
      setError(errorMessages[errorParam] || "Authentication error. Please try again.");
    }
  }, []);

  async function handleGoogleLogin() {
    setGoogleLoading(true);
    setError("");
    try {
      // Get redirect parameter if present
      const params = new URLSearchParams(window.location.search);
      const redirectPath = params.get("redirect") || "/dashboard";
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(redirectPath)}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        setError(error.message);
        setGoogleLoading(false);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Failed to initiate Google sign-in. Please try again.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-block">
            <Image 
              src="/logo.png" 
              alt="Research Room AI Logo" 
              width={140} 
              height={140}
              className="object-contain"
            />
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Welcome</CardTitle>
            <CardDescription>
              Sign in or create an account to start your literature review
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Google OAuth — only sign-in method */}
            <Button
              variant="outline"
              className="w-full gap-3 h-11 text-sm font-medium"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <Spinner size="sm" />
              ) : (
                <Chrome className="h-5 w-5 text-blue-500" />
              )}
              {googleLoading ? "Redirecting to Google..." : "Continue with Google"}
            </Button>

            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}

            <p className="text-center text-xs text-gray-400 pt-2">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
