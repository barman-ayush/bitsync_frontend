'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Eye, EyeOff, Loader2, XCircle } from 'lucide-react';
import { AuthSuccessResponse, ErrorResponse } from '@/types';
import { useUser } from '@/contexts/user.context';
import {
  isUsernameFormatValid,
  passwordRequirements,
  registerSchema,
  usernameRequirements,
  type RegisterFormData,
} from '@/lib/validators/register';
import { useUsernameAvailability } from '@/hooks/use-username-availability';

export default function RegisterPage() {
  const router = useRouter();
  const { user, setUser, setIsLoading } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (user) router.push('/');
  }, [user]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, touchedFields },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
  });

  const password = watch('password') ?? '';
  const username = watch('username') ?? '';
  const { status: usernameStatus, debouncedUsername } = useUsernameAvailability(username);

  const handleRegisterFormSubmit = async (data: RegisterFormData) => {
    try {
      setServerError('');
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
        setServerError(error.message);
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
      });

      router.push(`/auth/verify-email`);
    } catch (e) {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const usernameFormatValid = isUsernameFormatValid(username);
  const showUsernameRequirements = !!username && !usernameFormatValid;
  const showAvailability = usernameFormatValid && !errors.username;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border border-border/50 p-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Join BitSync and start collaborating</p>
        </div>

        <div
          className={`grid transition-all duration-300 ease-out ${serverError ? 'grid-rows-[1fr] opacity-100 mb-6' : 'grid-rows-[0fr] opacity-0'
            }`}
        >
          <div className="overflow-hidden">
            <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{serverError}</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleRegisterFormSubmit)} className="space-y-5" noValidate>
          {/* Username Field */}
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <div className="relative">
              <Input
                id="username"
                placeholder="doe-john"
                autoComplete="username"
                {...register('username')}
                className="bg-input border-border pr-10"
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

            {/* Username requirements (gradual reveal) */}
            <div
              className={`grid transition-all duration-300 ease-out ${showUsernameRequirements ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                <div className="mt-1 space-y-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground">Username requirements:</p>
                  <div className="space-y-1">
                    {usernameRequirements.map((req, idx) => {
                      const ok = req.test(username);
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

            {/* Availability message (gradual reveal) */}
            <div
              className={`grid transition-all duration-300 ease-out ${showAvailability && usernameStatus !== 'idle'
                ? 'grid-rows-[1fr] opacity-100'
                : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
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

            {/* Username field error (gradual reveal) */}
            <div
              className={`grid transition-all duration-300 ease-out ${errors.username && touchedFields.username ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                <p className="text-sm text-destructive">{errors.username?.message}</p>
              </div>
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="doejohn2980@example.com"
              {...register('email')}
              className="bg-input border-border"
            />
            <div
              className={`grid transition-all duration-300 ease-out ${errors.email ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                <p className="text-sm text-destructive">{errors.email?.message}</p>
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Enter your password"
                {...register('password')}
                className="bg-input border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* Password Requirements (gradual reveal) */}
            <div
              className={`grid transition-all duration-300 ease-out ${password ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                <div className="mt-1 space-y-2 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                  <div className="space-y-1">
                    {passwordRequirements.map((req, idx) => {
                      const ok = req.regex.test(password);
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
              className={`grid transition-all duration-300 ease-out ${errors.password && touchedFields.password ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                <p className="text-sm text-destructive mt-1">{errors.password?.message}</p>
              </div>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                className="bg-input border-border pr-10"
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
              className={`grid transition-all duration-300 ease-out ${errors.confirmPassword ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
            >
              <div className="overflow-hidden">
                <p className="text-sm text-destructive">{errors.confirmPassword?.message}</p>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting || usernameStatus === 'taken' || usernameStatus === 'checking'}
            className="w-full bg-primary hover:bg-primary/90 mt-6"
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>

        {/* Sign In Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
