import { IsString, IsOptional, MaxLength } from 'class-validator';

export class ApproveReviewDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  feedback?: string;
}
