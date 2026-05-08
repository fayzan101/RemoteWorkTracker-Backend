import { z } from 'zod';


export const registerDeviceSchema = z.object({
  deviceId: z.string().min(1, 'deviceId is required'),
  userId: z.string().uuid('userId must be a valid UUID').optional(),
  pairingCode: z.string().min(6, 'pairingCode must be at least 6 characters').max(12, 'pairingCode is too long').optional(),
  hostname: z.string().min(1, 'hostname is required'),
  os: z.string().min(1, 'os is required'),
}).refine((data) => Boolean(data.userId) || Boolean(data.pairingCode), {
  message: 'Either userId or pairingCode is required',
  path: ['userId'],
});


export const heartbeatSchema = z.object({
  deviceId: z.string().min(1, 'deviceId is required'),
  status: z.string().optional(),
});


export const activitySchema = z.object({
  activities: z.array(z.any()),
});


export const idleSchema = z.object({
  deviceId: z.string().min(1, 'deviceId is required'),
  idleDuration: z.number(),
});

export const createPairingCodeSchema = z.object({
  expiresInMinutes: z.number().int().min(1).max(60).optional(),
});
