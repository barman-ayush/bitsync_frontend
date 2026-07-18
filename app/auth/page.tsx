'use client';

import { Suspense, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { ErrorResponse, AuthSuccessResponse } from '@/types';
import { useUser } from '@/contexts/user.context';
import {
  isUsernameFormatValid,
  passwordRequirements,
  registerSchema,
  usernameRequirements,
  type RegisterFormData,
} from '@/lib/validators/register';
import { useUsernameAvailability } from '@/hooks/use-username-availability';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email: z.string({ message: 'Email is required.' }).email('Invalid email address.'),
  password: z.string({ message: 'Password is required.' }).min(1, 'Password is required.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
      </div>
    }>
      <AuthView />
    </Suspense>
  );
}

function AuthView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');

  const { user, setUser, setIsLoading } = useUser();
  const [mode, setMode] = useState<'login' | 'register'>(modeParam === 'register' ? 'register' : 'login');
  
  // Toggles for password visibility
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loginServerError, setLoginServerError] = useState('');
  const [registerServerError, setRegisterServerError] = useState('');
  const [loginUserData, setLoginUserData] = useState<LoginFormData>({ email: '', password: '' });

  // Sync mode parameter with state
  useEffect(() => {
    if (modeParam === 'register') {
      setMode('register');
    } else {
      setMode('login');
    }
  }, [modeParam]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user) {
      if (user.emailVerified) {
        router.push('/');
      } else {
        router.push('/auth/verify-email');
      }
    }
  }, [user, router]);

  // Form Hooks
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  const registerUsername = registerForm.watch('username') ?? '';
  const registerPassword = registerForm.watch('password') ?? '';
  const { status: usernameStatus, debouncedUsername } = useUsernameAvailability(registerUsername);

  // Sign In submit handler
  const onLoginSubmit = async () => {
    try {
      setLoginServerError('');
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(loginUserData),
      });
      const data: AuthSuccessResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        const error = data as ErrorResponse;
        // Backend sends a non-OK when email is unverified — redirect silently
        if (error.message?.toLowerCase().includes('email not verified')) {
          router.push('/auth/verify-email');
          return;
        }
        setLoginServerError(error.message);
        return;
      }

      const successData = data as AuthSuccessResponse;
      setUser({
        id: successData.data.id,
        email: successData.data.email,
        displayName: successData.data.displayName,
        avatarUrl: successData.data.avatarUrl,
        emailVerified: successData.data.emailVerified,
        createdAt: String(successData.data.createdAt),
        username: successData.data.username,
      });

      if (!successData.data.emailVerified) {
        router.push('/auth/verify-email');
      } else {
        router.push(`/?toast="${successData.message}"&toastType="${successData.status}"`);
      }
    } catch (e) {
      setLoginServerError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up submit handler
  const onRegisterSubmit = async (data: RegisterFormData) => {
    try {
      setRegisterServerError('');
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
        }),
      });
      const responseData: AuthSuccessResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        const error = responseData as ErrorResponse;
        setRegisterServerError(error.message);
        return;
      }

      const successData = responseData as AuthSuccessResponse;
      setUser({
        id: successData.data.id,
        email: successData.data.email,
        displayName: successData.data.displayName,
        avatarUrl: successData.data.avatarUrl,
        emailVerified: successData.data.emailVerified,
        createdAt: String(successData.data.createdAt),
        username: successData.data.username,
      });

      router.push(`/auth/verify-email`);
    } catch (e) {
      setRegisterServerError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleMode = (targetMode: 'login' | 'register') => {
    setMode(targetMode);
    router.replace(`/auth?mode=${targetMode}`, { scroll: false });
  };

  const usernameFormatValid = isUsernameFormatValid(registerUsername);
  const showUsernameRequirements = !!registerUsername && !usernameFormatValid;
  const showAvailability = usernameFormatValid && !registerForm.formState.errors.username;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left side: Grayscale image and landing page copy */}
      <div className="hidden md:flex md:w-1/2 md:h-screen md:sticky md:top-0 relative bg-slate-950 overflow-hidden flex-col justify-between p-12 text-white shrink-0">
        {/* Background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-40 grayscale contrast-125"
          style={{ backgroundImage: `url('/auth_theme_photo.png')` }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-slate-950/60 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/30" />

        {/* Brand visual space header */}
        <div className="relative z-10" />

        {/* Heading with styled pop highlights and hero text */}
        <div className="relative z-10 max-w-lg space-y-6">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Version control <br />
            <span className="bg-primary px-2 py-0.5 text-primary-foreground rounded inline-block">made effortless</span>
          </h1>
          <p className="text-base text-slate-300 drop-shadow-sm leading-relaxed">
            Not everyone lives in a terminal. BitSync brings the power of version control — repositories, workspaces, pull requests, and reviews — into a clean interface that anyone on your team can pick up in minutes.
          </p>
        </div>

        {/* Brand footer */}
        <div className="relative z-10 flex items-center gap-2 text-white/90">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-950 font-bold">
            B
          </div>
          <span className="text-lg font-semibold">BitSync</span>
        </div>
      </div>

      {/* Right side: Cardless login/register form */}
      <div className="flex-1 flex flex-col justify-between px-6 py-10 sm:px-12 bg-background md:max-w-xl lg:max-w-2xl mx-auto w-full">
        {/* RHS Top Brand Logo */}
        <div className="flex items-center gap-2 mb-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              B
            </div>
            <span className="text-lg font-semibold text-foreground">BitSync</span>
          </Link>
        </div>

        {/* Dynamic Form Area */}
        <div className="w-full max-w-sm mx-auto space-y-6 py-8">
          {mode === 'login' ? (
            <>
              {/* Login View */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Log in</h2>
                <p className="text-sm text-muted-foreground font-medium">Welcome back! Please enter your details.</p>
              </div>

              {loginServerError && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 font-medium">{loginServerError}</div>
              )}

              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    {...loginForm.register('email', {
                      onChange: (e) => setLoginUserData((prev) => ({ ...prev, email: e.target.value })),
                    })}
                    className="bg-transparent border-border h-10 placeholder:text-muted-foreground/60"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive mt-1 font-medium">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-semibold text-foreground">
                      Password
                    </label>
                    <Link href="/auth/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      {...loginForm.register('password', {
                        onChange: (e) => setLoginUserData((prev) => ({ ...prev, password: e.target.value })),
                      })}
                      className="bg-transparent border-border pr-10 h-10 placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive mt-1 font-medium">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loginForm.formState.isSubmitting}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-10 mt-6 transition-all"
                >
                  {loginForm.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
                </Button>
              </form>

              {/* Toggle to Register */}
              <p className="text-center text-sm text-muted-foreground font-medium">
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleToggleMode('register')}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              {/* Register View */}
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-foreground">Create Account</h2>
                <p className="text-sm text-muted-foreground font-medium">Join BitSync and start collaborating.</p>
              </div>

              {registerServerError && (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20 font-medium">{registerServerError}</div>
              )}

              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4" noValidate>
                {/* Username Field */}
                <div className="space-y-1.5">
                  <label htmlFor="username" className="text-sm font-semibold text-foreground">
                    Username
                  </label>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="doe-john"
                      autoComplete="username"
                      {...registerForm.register('username')}
                      className="bg-transparent border-border pr-10 h-10 placeholder:text-muted-foreground/60"
                    />
                    {showAvailability && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity duration-200">
                        {usernameStatus === 'checking' && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {usernameStatus === 'available' && (
                          <CheckCircle2 className="h-4 w-4 text-accent" />
                        )}
                        {usernameStatus === 'taken' && <XCircle className="h-4 w-4 text-destructive" />}
                      </div>
                    )}
                  </div>

                  {/* Username requirements */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${showUsernameRequirements ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-1 space-y-2 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-semibold text-muted-foreground">Username requirements:</p>
                        <div className="space-y-1">
                          {usernameRequirements.map((req, idx) => {
                            const ok = req.test(registerUsername);
                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 text-xs transition-colors duration-200 ${ok ? 'text-accent' : 'text-muted-foreground'
                                  }`}
                              >
                                <div
                                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${ok ? 'bg-accent' : 'bg-border'
                                    }`}
                                />
                                {req.text}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Availability check */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${showAvailability && usernameStatus !== 'idle'
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden pt-1">
                      {usernameStatus === 'checking' && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Checking availability…
                        </p>
                      )}
                      {usernameStatus === 'available' && (
                        <p className="text-sm text-accent flex items-center gap-1.5 font-medium">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span className="font-mono">{debouncedUsername}</span> is available
                        </p>
                      )}
                      {usernameStatus === 'taken' && (
                        <p className="text-sm text-destructive flex items-center gap-1.5">
                          <XCircle className="h-3.5 w-3.5" />
                          <span className="font-mono">{debouncedUsername}</span> is already taken
                        </p>
                      )}
                      {usernameStatus === 'error' && (
                        <p className="text-sm text-muted-foreground">Could not check availability.</p>
                      )}
                    </div>
                  </div>

                  {/* Form validator error */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${registerForm.formState.errors.username && registerForm.formState.touchedFields.username ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-destructive font-medium">{registerForm.formState.errors.username?.message}</p>
                    </div>
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-semibold text-foreground">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="doejohn2980@example.com"
                    {...registerForm.register('email')}
                    className="bg-transparent border-border h-10 placeholder:text-muted-foreground/60"
                  />
                  <div
                    className={`grid transition-all duration-300 ease-out ${registerForm.formState.errors.email ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-destructive font-medium">{registerForm.formState.errors.email?.message}</p>
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="password" className="text-sm font-semibold text-foreground">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Enter your password"
                      {...registerForm.register('password')}
                      className="bg-transparent border-border pr-10 h-10 placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Password requirements */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${registerPassword ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <div className="mt-1 space-y-2 p-3 rounded-lg bg-muted/50">
                        <p className="text-xs font-semibold text-muted-foreground">Password requirements:</p>
                        <div className="space-y-1">
                          {passwordRequirements.map((req, idx) => {
                            const ok = req.regex.test(registerPassword);
                            return (
                              <div
                                key={idx}
                                className={`flex items-center gap-2 text-xs transition-colors duration-200 ${ok ? 'text-accent' : 'text-muted-foreground'
                                  }`}
                              >
                                <div
                                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-200 ${ok ? 'bg-accent' : 'bg-border'
                                    }`}
                                />
                                {req.text}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-300 ease-out ${registerForm.formState.errors.password && registerForm.formState.touchedFields.password ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-destructive mt-1 font-medium">{registerForm.formState.errors.password?.message}</p>
                    </div>
                  </div>
                </div>

                {/* Confirm Password Field */}
                <div className="space-y-1.5">
                  <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      {...registerForm.register('confirmPassword')}
                      className="bg-transparent border-border pr-10 h-10 placeholder:text-muted-foreground/60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div
                    className={`grid transition-all duration-300 ease-out ${registerForm.formState.errors.confirmPassword ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                      }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-destructive font-medium">{registerForm.formState.errors.confirmPassword?.message}</p>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={registerForm.formState.isSubmitting || usernameStatus === 'taken' || usernameStatus === 'checking'}
                  className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold h-10 mt-6 transition-all"
                >
                  {registerForm.formState.isSubmitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>

              {/* Toggle to Login */}
              <p className="text-center text-sm text-muted-foreground font-medium">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => handleToggleMode('login')}
                  className="text-primary hover:underline font-semibold"
                >
                  Sign in
                </button>
              </p>
            </>
          )}
        </div>

        {/* RHS Bottom Footer Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground border-t border-border/40 pt-6">
          <span>By proceeding, you agree to the <Link href="#" className="underline hover:text-foreground transition-colors">Terms</Link> and <Link href="#" className="underline hover:text-foreground transition-colors">Privacy Policy</Link></span>
          <span className="flex items-center gap-1 hover:text-foreground transition-colors cursor-pointer">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            support@bitsync.app
          </span>
        </div>
      </div>
    </div>
  );
}
