'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import { ErrorResponse, AuthSuccessResponse } from '@/types';
import { useUser } from '@/contexts/user.context';

const loginSchema = z.object({
  email: z.string({ message: 'Email is required.' }).email('Invalid email address.'),
  password: z.string({ message: 'Password is required.' }).min(1, 'Password is required.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, setUser } = useUser();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [userData, setUserData] = useState<LoginFormData>({ email: "", password: "" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (user) router.push("/");
  }, [user]);

  const onSubmit = async () => {
    try {
      setServerError('');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(userData),
      });
      const data: AuthSuccessResponse | ErrorResponse = await response.json();

      if (!response.ok) {
        const error = data as ErrorResponse;
        setServerError(error.message);
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
      });

      router.push(`/?toast="${successData.message}"&toastType="${successData.status}"`);
    } catch (e) {
      setServerError('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border border-border/50 p-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground">Sign in to your BitSync account</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email', {
                onChange: (e) => setUserData((prev) => ({ ...prev, email: e.target.value })),
              })}
              className="bg-input border-border"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium">
                Password
              </label>
              <Link href="/auth/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password', {
                  onChange: (e) => { setUserData((prev) => ({ ...prev, password: e.target.value })) }
                })}
                className="bg-input border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 mt-6"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Sign Up Link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
