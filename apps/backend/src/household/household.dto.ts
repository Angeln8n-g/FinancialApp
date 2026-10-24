import { Role } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

export class InviteMemberDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @IsOptional()
  @IsEnum(Role, { message: 'El rol debe ser válido' })
  role?: Role;
}

export class UpdateRoleDto {
  @IsEnum(Role, { message: 'El rol debe ser válido' })
  role!: Role;
}
