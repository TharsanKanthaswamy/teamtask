import { IsUUID, IsNotEmpty, IsEnum, IsString, MaxLength, IsOptional } from 'class-validator';
import { NotificationType } from '@prisma/client';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId!: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type!: NotificationType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  message!: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  entityType?: string;

  @IsUUID()
  @IsOptional()
  entityId?: string;
}
