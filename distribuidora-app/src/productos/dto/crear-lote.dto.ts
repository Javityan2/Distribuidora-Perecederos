import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearLoteDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(4294967295)
  productoId!: number;
  @ApiProperty({ example: 'Proveedor local' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  proveedor!: string;
  @ApiProperty({ example: 20 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Max(999999999.999)
  cantidadDisponible!: number;
  @ApiProperty({ example: '2026-10-22T12:00:00Z' })
  @IsISO8601({ strict: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/)
  fechaIngreso!: string;
  @ApiProperty({ example: '2026-12-22T12:00:00Z' })
  @IsISO8601({ strict: true })
  @Matches(/(Z|[+-]\d{2}:\d{2})$/)
  fechaCaducidad!: string;
}
