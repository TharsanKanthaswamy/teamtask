import { IsUUID, IsString, IsOptional, MaxLength, IsEmail } from 'class-validator';

export class AddProjectMemberDto {
  @IsUUID()
  @IsOptional()
  teamMemberId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  responsibility?: string;
}
