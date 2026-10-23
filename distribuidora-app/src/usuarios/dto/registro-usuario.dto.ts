import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegistroUsuarioDto {
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(2)
  @MaxLength(150)
  @ApiProperty({ type: String })
  nombre!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @MaxLength(254)
  @ApiProperty({ type: String })
  correo!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @ApiProperty({ type: String, format: 'password' })
  password!: string;
}
