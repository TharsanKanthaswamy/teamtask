import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID, IsInt, Min, IsISO8601, MaxLength } from 'class-validator';
import { TaskPriority } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  description?: string;

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @IsInt()
  @Min(1)
  @IsOptional()
  weight?: number;

  @IsUUID()
  @IsOptional()
  milestoneId?: string;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  dueDate?: string;
}
