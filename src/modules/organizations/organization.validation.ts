import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/),
  roleId: z.string().uuid(),
  departmentId: z.string().uuid(),
  organizationId: z.string().uuid(),
  region: z.string().length(2),
  salary: z.number().min(0)
});
export const orgForgotPasswordSchema = z.object({
  email: z.string().email()
});

export const orgResetPasswordSchema = z.object({
  resetCode: z.string().length(6).regex(/^\d{6}$/),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/)
});

export function validateOrgForgotPassword(data: unknown) {
  return orgForgotPasswordSchema.safeParse(data);
}

export function validateOrgResetPassword(data: unknown) {
  return orgResetPasswordSchema.safeParse(data);
}
export const organizationRefreshTokenSchema = z.object({
  refreshToken: z.string().min(10)
});

export function validateOrganizationRefreshToken(data: unknown) {
  return organizationRefreshTokenSchema.safeParse(data);
}
export const organizationLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export function validateOrganizationLogin(data: unknown) {
  return organizationLoginSchema.safeParse(data);
}

export const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().optional(),
  organization_type: z.string().optional(),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6)
});

export function validateCreateOrganization(data: unknown) {
  return createOrganizationSchema.safeParse(data);
}

export const changeAdminPasswordSchema = z.object({
  organizationId: z.string().uuid(),
  oldPassword: z.string().min(8),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).+$/)
});

export function validateChangeAdminPassword(data: unknown) {
  return changeAdminPasswordSchema.safeParse(data);
}
