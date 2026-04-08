'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';

const registerSchema = z
  .object({
    name: z.string({ message: 'Name is required.' }).min(2, 'Name must be at least 2 characters.'),
    email: z.string({ message: 'Email is required.' }).email('Invalid email address.'),
    password: z
      .string({ message: 'Password is required.' })
      .min(8, 'Password must be at least 8 characters long.')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
      .regex(/[0-9]/, 'Password must contain at least one number.')
      .regex(
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
        'Password must contain at least one special character.'
      ),
    confirmPassword: z.string({ message: 'Confirm password is required.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

interface FieldError {
  field: keyof RegisterFormData;
  message: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<FieldError[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password');

  // Real-time password validation
  const validatePassword = (pwd: string) => {
    const newErrors: FieldError[] = [];

    if (pwd.length < 8) {
      newErrors.push({ field: 'password', message: 'At least 8 characters' });
    }
    if (!/[A-Z]/.test(pwd)) {
      newErrors.push({ field: 'password', message: 'One uppercase letter' });
    }
    if (!/[a-z]/.test(pwd)) {
      newErrors.push({ field: 'password', message: 'One lowercase letter' });
    }
    if (!/[0-9]/.test(pwd)) {
      newErrors.push({ field: 'password', message: 'One number' });
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
      newErrors.push({ field: 'password', message: 'One special character' });
    }

    setPasswordErrors(newErrors);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError('');
      // TODO: Implement actual registration API call
      console.log('Register data:', data);

      // For now, redirect to email verification page
      // In production, this would be after a successful API call
      router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      setServerError('Failed to create account. Please try again.');
      console.error('Registration error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border border-border/50 p-8">
        <div className="mb-8 space-y-2">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-muted-foreground">Join BitSync and start collaborating</p>
        </div>

        {serverError && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{serverError}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Name Field */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register('name')}
              className="bg-input border-border"
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              {...register('email')}
              className="bg-input border-border"
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
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
                placeholder="Enter your password"
                {...register('password')}
                onChange={(e) => {
                  register('password').onChange(e);
                  validatePassword(e.target.value);
                }}
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

            {/* Password Requirements */}
            {password && (
              <div className="mt-3 space-y-2 p-3 rounded-lg bg-muted/50">
                <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
                <div className="space-y-1">
                  {[
                    { regex: /.{8,}/, text: 'At least 8 characters' },
                    { regex: /[A-Z]/, text: 'One uppercase letter' },
                    { regex: /[a-z]/, text: 'One lowercase letter' },
                    { regex: /[0-9]/, text: 'One number' },
                    {
                      regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
                      text: 'One special character',
                    },
                  ].map((req, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs transition ${
                        req.regex.test(password) ? 'text-accent' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`h-1.5 w-1.5 rounded-full transition ${
                          req.regex.test(password) ? 'bg-accent' : 'bg-border'
                        }`}
                      />
                      {req.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {errors.password && <p className="text-sm text-destructive mt-2">{errors.password.message}</p>}
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
                placeholder="Confirm your password"
                {...register('confirmPassword')}
                className="bg-input border-border pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
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
