import { IsInt, Min, Max, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength, MaxLength, IsUrl } from 'class-validator';

export class SubmitContributionDto {
  @IsInt()
  @Min(0)
  @Max(100)
  @IsNotEmpty()
  progressPercent!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  hoursSpent?: number;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @IsNotEmpty()
  description!: string;

  @IsUrl()
  @IsOptional()
  @MaxLength(500)
  evidenceUrl?: string;
}
