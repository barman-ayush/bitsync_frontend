'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Mail, ArrowLeft } from 'lucide-react';
import { useUser } from '@/contexts/user.context';

export default function VerifyEmailPage() {
  const router = useRouter();

  const [timeLeft, setTimeLeft] = useState(60);
  const { user } = useUser();
  const [canResend, setCanResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (user && user.emailVerified) {
      router.push("/?toast=User Already Verified&toastType=info");
      return;
    }

    async function sendVerificationEmail() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-email`,
          { credentials: 'include' },
        );
        const data = await res.json();

        if (!res.ok) {
          console.log('Send email error:', data.message);
          return;
        }

        if (data.message === 'Email is already verified.') {
          router.push('/?toast=Email verified&toastType=success');
        }
      } catch (e) {
        console.log('Failed to send verification email:', e);
      }
    }

    sendVerificationEmail();
  }, [])

  // Timer effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  const handleResend = useCallback(async () => {
    try {
      setIsResending(true);
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/send-email`,
        { credentials: 'include' },
      );
      const data = await res.json();

      if (!res.ok) {
        console.log('Resend email error:', data.message);
        return;
      }

      if (data.message === 'Email is already verified.') {
        router.push('/?toast=Email verified&toastType=success');
        return;
      }

      setTimeLeft(60);
      setCanResend(false);
    } catch (e) {
      console.log('Failed to resend verification email:', e);
    } finally {
      setIsResending(false);
    }
  }, [router]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border border-border/50 p-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Email Icon */}
        <div className="flex justify-center mb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <Mail className="h-8 w-8 text-accent" />
          </div>
        </div>

        {/* Content */}
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-3xl font-bold">Check your email</h1>
          <p className="text-muted-foreground">
            We&apos;ve sent a verification link to:
          </p>
          <p className="font-medium text-foreground break-all">{user?.email}</p>
          <p className="text-sm text-muted-foreground pt-2">
            Click the link in the email to verify your account and get started with BitSync.
          </p>
        </div>

        {/* Timer and Resend */}
        <div className="space-y-4 py-6 border-y border-border/50">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Didn&apos;t receive the email?</p>
            {!canResend ? (
              <p className="text-sm font-medium">
                You can resend in <span className="text-accent font-bold">{formatTime(timeLeft)}</span>
              </p>
            ) : (
              <Button
                onClick={handleResend}
                disabled={isResending}
                variant="outline"
                className="w-full"
              >
                {isResending ? 'Resending...' : 'Resend Email'}
              </Button>
            )}
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 rounded-lg bg-muted/50 space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Troubleshooting:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• Check your spam or junk folder</li>
            <li>• Make sure to use the correct email address</li>
            <li>• Verification links expire after 24 hours</li>
          </ul>
        </div>

        {/* Contact Support */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Still need help?{' '}
          <a href="#" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </Card>
    </div>
  );
}
