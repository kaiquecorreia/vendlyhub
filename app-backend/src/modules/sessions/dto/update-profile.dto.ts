import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @ValidateIf((o: UpdateProfileDto) => !!o.newPassword || !!o.currentPassword)
  @IsNotEmpty({ message: 'Informe a senha atual' })
  @IsString()
  currentPassword?: string;

  @ValidateIf((o: UpdateProfileDto) => !!o.newPassword || !!o.currentPassword)
  @IsNotEmpty({ message: 'Informe a nova senha' })
  @IsString()
  @MinLength(8, { message: 'A nova senha deve ter no mínimo 8 caracteres' })
  newPassword?: string;
}
