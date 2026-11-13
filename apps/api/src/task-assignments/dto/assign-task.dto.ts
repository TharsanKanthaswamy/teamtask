import { IsUUID, IsNotEmpty, IsInt, Min, Max, IsString, IsOptional, MaxLength } from 'class-validator';

export class AssignTaskDto {
  @IsUUID()
  @IsNotEmpty()
  teamMemberId!: string;

  @IsInt()
  @Min(1)
  @Max(100)
  allocatedWeight!: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  responsibility?: string;
}
