import { z } from 'zod';

// bcrypt only uses the first 72 bytes of the input
const BCRYPT_MAX_BYTES = 72;

export const usernameSchema = z
  .string('Username is required')
  .trim()
  .toLowerCase()
  .min(3, 'Username must be at least 3 characters')
  .max(24, 'Username must be at most 24 characters')
  .regex(/^[a-z0-9_-]+$/, 'Use only letters, numbers, dashes and underscores');

const newPassword = z
  .string('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => new TextEncoder().encode(value).length <= BCRYPT_MAX_BYTES, {
    message: `Password must be at most ${BCRYPT_MAX_BYTES} bytes`,
  });

export const registerSchema = z.object({ username: usernameSchema, password: newPassword });

export const loginSchema = z.object({
  username: z.string('Username is required').trim().toLowerCase().min(1, 'Username is required'),
  password: z.string('Password is required').min(1, 'Password is required'),
});
