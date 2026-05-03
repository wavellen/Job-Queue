import { z } from 'zod';

export const jobPayloadSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('send-email'),
    payload: z.object({
      to: z.string().email(),
      subject: z.string().min(1),
      body: z.string().min(1),
    }),
  }),
  z.object({
    type: z.literal('process-image'),
    payload: z.object({
      imageUrl: z.string().url(),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
      format: z.enum(['jpeg', 'png', 'webp']),
    }),
  }),
  z.object({
    type: z.literal('generate-report'),
    payload: z.object({
      reportType: z.enum(['daily', 'weekly', 'monthly']),
      userId: z.string().uuid(),
    }),
  }),
]);

export const createJobSchema = z.object({
  body: jobPayloadSchema,
});
