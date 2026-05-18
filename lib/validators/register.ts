import { z } from 'zod';

export const USERNAME_CHARSET = /^[a-zA-Z0-9-]+$/;

export const usernameSchema = z
  .string({ message: 'Username is required.' })
  .min(1, 'Username is required.')
  .max(39, 'Username must be at most 39 characters.')
  .regex(USERNAME_CHARSET, 'Username can only contain letters, numbers, and hyphens.')
  .refine((val) => !val.startsWith('-'), { message: 'Username cannot start with a hyphen.' })
  .refine((val) => !val.endsWith('-'), { message: 'Username cannot end with a hyphen.' })
  .refine((val) => !val.includes('--'), { message: 'Username cannot contain consecutive hyphens.' });

export const registerSchema = z
  .object({
    username: usernameSchema,
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

export type RegisterFormData = z.infer<typeof registerSchema>;

export const usernameRequirements: { test: (v: string) => boolean; text: string }[] = [
  { test: (v) => v.length > 0 && v.length <= 39, text: 'At most 39 characters' },
  { test: (v) => USERNAME_CHARSET.test(v), text: 'Letters, numbers, and hyphens only' },
  { test: (v) => !v.startsWith('-') && !v.endsWith('-'), text: 'Does not start or end with a hyphen' },
  { test: (v) => !v.includes('--'), text: 'No consecutive hyphens' },
];

export const passwordRequirements: { regex: RegExp; text: string }[] = [
  { regex: /.{8,}/, text: 'At least 8 characters' },
  { regex: /[A-Z]/, text: 'One uppercase letter' },
  { regex: /[a-z]/, text: 'One lowercase letter' },
  { regex: /[0-9]/, text: 'One number' },
  { regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, text: 'One special character' },
];

export const isUsernameFormatValid = (username: string): boolean =>
  !!username &&
  username.length <= 39 &&
  USERNAME_CHARSET.test(username) &&
  !username.startsWith('-') &&
  !username.endsWith('-') &&
  !username.includes('--');
