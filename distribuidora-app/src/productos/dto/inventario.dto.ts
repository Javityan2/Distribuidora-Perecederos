import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class ProductoDto {
  @ApiProperty({ example: 'Carne de res' })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre!: string;
  @ApiProperty({ example: 'A granel' })
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
export class LoteDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(4294967295)
  productoId!: number;
  @ApiProperty({ example: 'Proveedor local' })
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
export class PedidoDto {
  @ApiProperty({
    example: 1,
    description: 'Un cliente solo puede crear pedidos para su propio ID',
  })
  @IsInt()
  @Min(1)
  @Max(4294967295)
  clienteId!: number;
}
export class LineaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(4294967295)
  productoId!: number;
  @ApiProperty({ example: 2 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Max(999999999.999)
  cantidad!: number;
}
export class SurtidoDto {
  @ApiProperty({ type: [LineaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaDto)
  lineas!: LineaDto[];
}
export class MermaDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  @Max(4294967295)
  loteId!: number;
  @ApiProperty({ example: 1 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Max(999999999.999)
  cantidad!: number;
  @ApiProperty({ enum: ['caducidad', 'daño', 'faltante'] })
  @IsEnum({ caducidad: 'caducidad', daño: 'daño', faltante: 'faltante' })
  motivo!: 'caducidad' | 'daño' | 'faltante';
}
