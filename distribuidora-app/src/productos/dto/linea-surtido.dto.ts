import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, Max, Min } from 'class-validator';

export class LineaSurtidoDto {
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
