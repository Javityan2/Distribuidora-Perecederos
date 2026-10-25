import { BadRequestException, Injectable } from '@nestjs/common';
import type { PipeTransform } from '@nestjs/common';

@Injectable()
export class IdPositivoPipe implements PipeTransform<string, number> {
  transform(valor: string): number {
    const id = Number(valor);
    if (
      !/^\d+$/.test(valor) ||
      !Number.isSafeInteger(id) ||
      id < 1 ||
      id > 4294967295
    )
      throw new BadRequestException(
        'El identificador debe ser un entero positivo válido',
      );
    return id;
  }
}
