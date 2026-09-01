import { IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateLiveStreamDto {
  @IsString()
  @Length(3, 120)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
