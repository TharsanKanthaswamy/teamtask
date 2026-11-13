import { IsUUID, IsNotEmpty } from 'class-validator';

export class SubmitReviewDto {
  @IsUUID()
  @IsNotEmpty()
  taskAssigneeId!: string;
}
