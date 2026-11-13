import { IsEnum, IsISO8601, IsOptional } from 'class-validator';

export enum ReportFormat {
  CSV = 'csv',
  JSON = 'json',
}

export class GenerateReportDto {
  @IsEnum(ReportFormat)
  @IsOptional()
  format?: ReportFormat;

  @IsISO8601()
  @IsOptional()
  startDate?: string;

  @IsISO8601()
  @IsOptional()
  endDate?: string;
}
