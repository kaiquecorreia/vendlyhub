import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

export class LoginDto {
  @IsOptional()
  @ValidateIf((o: LoginDto) => !o.whatsapp)
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @IsOptional()
  @ValidateIf((o: LoginDto) => !o.email)
  @IsNotEmpty()
  @IsString()
  whatsapp?: string;

  @IsNotEmpty()
  @IsString()
  password!: string;
}
