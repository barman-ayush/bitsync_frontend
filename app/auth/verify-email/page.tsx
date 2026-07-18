'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-8 md:px-16 lg:px-24">
      {/* Fixed top-left logo */}
      <div className="fixed top-0 left-0 right-0 z-20 px-8 md:px-16 lg:px-24 py-5 flex items-center">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-sm group-hover:shadow-primary/30 transition-shadow">
            B
          </div>
          <span className="text-base font-semibold text-foreground tracking-tight">BitSync</span>
        </Link>
      </div>

      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 20%, hsl(var(--accent) / 0.18) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-2xl relative z-10">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div
            className="relative flex h-20 w-20 items-center justify-center rounded-2xl"
            style={{
              background:
                'linear-gradient(135deg, hsl(var(--accent) / 0.15), hsl(var(--accent) / 0.05))',
              boxShadow: '0 0 0 1px hsl(var(--accent) / 0.2), 0 8px 32px hsl(var(--accent) / 0.12)',
            }}
          >
            <Mail className="h-9 w-9 text-accent" strokeWidth={1.5} />
            {/* Animated ping */}
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-50" />
              <span className="relative inline-flex h-4 w-4 rounded-full bg-accent opacity-80" />
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Check your email
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            We&apos;ve sent a verification link to
          </p>
          <p
            className="mt-2 inline-block font-semibold text-foreground text-lg px-4 py-1.5 rounded-lg"
            style={{
              background: 'hsl(var(--accent) / 0.08)',
              border: '1px solid hsl(var(--accent) / 0.2)',
            }}
          >
            {user?.email ?? '—'}
          </p>
          <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Click the link in the email to verify your account and get started with BitSync.
          </p>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-border/50 mb-8" />

        {/* Resend section */}
        <div className="flex flex-col items-center gap-4 mb-10">
          <p className="text-sm text-muted-foreground">Didn&apos;t receive the email?</p>

          {!canResend ? (
            <div className="flex items-center gap-2 text-sm font-medium">
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" style={{ animationDuration: '3s' }} />
              <span className="text-muted-foreground">
                Resend available in{' '}
                <span className="text-accent font-bold tabular-nums">{formatTime(timeLeft)}</span>
              </span>
            </div>
          ) : (
            <Button
              onClick={handleResend}
              disabled={isResending}
              className="px-8 gap-2"
              style={{
                background: isResending ? undefined : 'hsl(var(--accent))',
                color: 'hsl(var(--accent-foreground))',
              }}
            >
              <RefreshCw className={`h-4 w-4 ${isResending ? 'animate-spin' : ''}`} />
              {isResending ? 'Resending...' : 'Resend Email'}
            </Button>
          )}
        </div>

        {/* Tips row */}
        <div
          className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"
        >
          {[
            { icon: <AlertCircle className="h-4 w-4" />, text: 'Check your spam or junk folder' },
            { icon: <CheckCircle className="h-4 w-4" />, text: 'Make sure you used the correct email' },
            { icon: <Mail className="h-4 w-4" />, text: 'Verification links expire after 24 hours' },
          ].map(({ icon, text }) => (
            <div
              key={text}
              className="flex items-start gap-3 px-4 py-3 rounded-xl text-xs text-muted-foreground"
              style={{
                background: 'hsl(var(--muted) / 0.5)',
                border: '1px solid hsl(var(--border) / 0.5)',
              }}
            >
              <span className="mt-0.5 shrink-0 text-accent/70">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground">
          Still need help?{' '}
          <a href="#" className="text-accent hover:underline underline-offset-4">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
