import {
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
  ArrayMinSize,
  ArrayUnique,
  IsIn,
} from 'class-validator';
import { DocumentType } from '@prisma/client';
import { ESTABLISHMENT_TYPE_NAMES } from '../../../shared/constants/establishment-type-names';
import { TransformToEstablishmentTypes } from './transform-establishment-types';

const ALLOWED_ESTABLISHMENT_TYPES = [...ESTABLISHMENT_TYPE_NAMES] as string[];

export class UpdateEstablishmentDto {
  @IsString()
  @MinLength(1)
  establishmentName!: string;

  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsString()
  @MinLength(1)
  document!: string;

  @TransformToEstablishmentTypes()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsString({ each: true })
  @IsIn(ALLOWED_ESTABLISHMENT_TYPES, { each: true })
  establishmentTypes!: string[];

  @IsOptional()
  @IsString()
  cep?: string;

  @IsOptional()
  @IsString()
  street?: string;

  @IsOptional()
  @IsString()
  number?: string;

  @IsOptional()
  @IsString()
  complement?: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  pixCopyPaste?: string;
}
