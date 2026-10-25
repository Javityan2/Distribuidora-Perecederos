import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class CrearPedidoDto {
  @ApiProperty({
    example: 1,
    description: 'Un cliente solo puede crear pedidos para su propio ID',
  })
  @IsInt()
  @Min(1)
  @Max(4294967295)
  clienteId!: number;
}
