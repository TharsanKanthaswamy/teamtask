import { IsString, IsOptional, IsEnum, IsISO8601, MinLength, MaxLength } from 'class-validator';
import { ProjectPriority } from '@prisma/client';

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  objectives?: string;

  @IsEnum(ProjectPriority)
  @IsOptional()
  priority?: ProjectPriority;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  targetEndDate?: string;

  @IsISO8601()
  @IsOptional()
  actualEndDate?: string;
}
