import { IsString, IsNotEmpty, IsUUID, IsOptional, IsEnum, IsISO8601, IsArray, MinLength, MaxLength, Matches } from 'class-validator';
import { ProjectPriority } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  @MaxLength(100)
  slug!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  objectives?: string;

  @IsString()
  @IsOptional()
  projectLeadId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  manualLeadName?: string;

  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  targetEndDate?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  initialMemberIds?: string[];
}
