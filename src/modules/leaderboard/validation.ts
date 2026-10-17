import { z } from 'zod';

export const uidSchema = z
  .string('UID is required')
  .trim()
  .regex(/^\d{9,10}$/, 'Enter your 9 or 10 digit Genshin Impact UID');

export const scenarioIdSchema = z
  .string()
  .trim()
  .max(50)
  .regex(/^[a-z0-9-]+$/, 'Invalid scenario');

export const leaderboardQuerySchema = z.object({
  scenarioId: scenarioIdSchema.optional(),
  /** Page size */
  limit: z.coerce.number().int().min(1).max(100).default(100),
  page: z.coerce.number().int().min(1).max(100_000).default(1),
  q: z.string().trim().max(30).optional(),
  focus: uidSchema.optional(),
});
