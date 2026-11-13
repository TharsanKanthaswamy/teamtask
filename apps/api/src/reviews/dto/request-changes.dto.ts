import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class RequestChangesDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(1000)
  feedback!: string;
}
