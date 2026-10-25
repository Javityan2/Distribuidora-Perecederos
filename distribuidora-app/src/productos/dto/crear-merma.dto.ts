import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNumber, Max, Min } from 'class-validator';

export class CrearMermaDto {
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
