import { z } from 'zod';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const RegisterSchema = z.object({
  email: z.string().email('Valid email address is required').max(254),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
  firstName: z.string().min(2, 'First name is required').max(80),
  lastName: z.string().min(2, 'Last name is required').max(80),
  universityCode: z.string().min(2).max(30).default('DDU'),
  studentId: z.string().max(50).optional(),
  phone: z.string().max(30).optional(),
});

export type RegisterDto = z.infer<typeof RegisterSchema>;

export class RegisterRequestDto {
  @ApiProperty({ example: 'student.abebe@ddu.edu.et' })
  email!: string;

  @ApiProperty({ example: 'Student123!' })
  password!: string;

  @ApiProperty({ example: 'Abebe' })
  firstName!: string;

  @ApiProperty({ example: 'Tadesse' })
  lastName!: string;

  @ApiPropertyOptional({ example: 'DDU' })
  universityCode?: string;

  @ApiPropertyOptional({ example: 'DDU/1234/14' })
  studentId?: string;

  @ApiPropertyOptional({ example: '+251911000000' })
  phone?: string;
}

export const LoginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginDto = z.infer<typeof LoginSchema>;

export class LoginRequestDto {
  @ApiProperty({ example: 'admin@ddu.edu.et' })
  email!: string;

  @ApiProperty({ example: 'Admin123!' })
  password!: string;
}

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
});

export type ChangePasswordDto = z.infer<typeof ChangePasswordSchema>;

export class ChangePasswordRequestDto {
  @ApiProperty({ example: 'CurrentPassword123!' })
  currentPassword!: string;

  @ApiProperty({ example: 'NewSecret123!' })
  newPassword!: string;
}

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordSchema>;

export class ForgotPasswordRequestDto {
  @ApiProperty({ example: 'user@ddu.edu.et' })
  email!: string;
}

export const ResetPasswordSchema = z.object({
  token: z.string().min(32, 'Valid reset token is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and numbers',
    ),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordSchema>;

export class ResetPasswordRequestDto {
  @ApiProperty({ example: 'a1b2c3d4...' })
  token!: string;

  @ApiProperty({ example: 'NewPassword123!' })
  newPassword!: string;
}

export const VerifyEmailSchema = z.object({
  token: z.string().min(32, 'Valid verification token is required'),
});

export type VerifyEmailDto = z.infer<typeof VerifyEmailSchema>;

export class VerifyEmailRequestDto {
  @ApiProperty({ example: 'verification_token_here' })
  token!: string;
}
