import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { CategoryStatus } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsEnum(CategoryStatus)
  status!: CategoryStatus;
}
