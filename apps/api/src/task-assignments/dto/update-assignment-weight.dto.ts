import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';

export class UpdateAssignmentWeightDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @IsNotEmpty()
  allocatedWeight!: number;
}
