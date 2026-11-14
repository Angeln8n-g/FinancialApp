import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  password!: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'El correo electrónico debe ser válido' })
  @IsNotEmpty({ message: 'El correo electrónico es requerido' })
  email!: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password!: string;

  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  fullName!: string;

  @IsOptional()
  @IsBoolean({ message: 'El indicador de cuenta para niño debe ser booleano' })
  isChildAccount?: boolean;

  @ValidateIf((o) => o.isChildAccount === true)
  @IsEmail({}, { message: 'Debes ingresar un correo electrónico válido del padre o tutor para el control parental' })
  @IsNotEmpty({ message: 'El correo del padre o tutor es obligatorio para cuentas de niño' })
  parentEmail?: string;
}
