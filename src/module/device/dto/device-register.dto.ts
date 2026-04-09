import { IsNotEmpty, IsString, Matches, IsOptional } from 'class-validator';

export class DeviceRegisterDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^SMP-\w+/, { message: 'Некорректный deviceId' })
  deviceId!: string;

  @IsString()
  @IsNotEmpty()
  zoneName!: string;

  @IsOptional()
  @IsString()
  qr?: string;
}
