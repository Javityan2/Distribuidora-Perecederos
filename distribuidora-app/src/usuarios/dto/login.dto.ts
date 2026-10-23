import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  @ApiProperty({ type: String })
  correo!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  @ApiProperty({ type: String, format: 'password' })
  password!: string;
}
