import { IsUUID, IsNotEmpty, IsString, IsOptional, MaxLength } from 'class-validator';

export class AddProjectMemberDto {
  @IsUUID()
  @IsNotEmpty()
  teamMemberId!: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  responsibility?: string;
}
