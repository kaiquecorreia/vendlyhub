import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateEstablishmentPixDto {
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pixCopyPaste?: string;
}
