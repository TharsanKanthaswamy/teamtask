import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignProjectLeadDto {
  @IsUUID()
  @IsNotEmpty()
  teamMemberId!: string;
}
