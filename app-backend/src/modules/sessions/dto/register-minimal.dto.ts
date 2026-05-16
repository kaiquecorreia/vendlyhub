import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterMinimalDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(1)
  establishmentName!: string;

  @IsNotEmpty()
  @IsString()
  whatsapp!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsString()
  pixCopyPaste?: string;
}
