import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearProductoDto {
  @ApiProperty({ example: 'Carne de res' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;
  @ApiProperty({ example: 'A granel' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  presentacion!: string;
  @ApiProperty({ enum: ['kg', 'pieza', 'caja'] })
  @IsEnum({ kg: 'kg', pieza: 'pieza', caja: 'caja' })
  unidadMedida!: 'kg' | 'pieza' | 'caja';
  @ApiProperty({ example: 180 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(9999999999.99)
  precioBase!: number;
  @ApiProperty({ example: 5 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  @Max(999999999.999)
  stockMinimo!: number;
}
