import { describe, it, expect } from '@jest/globals';
import { BadRequestException } from '@nestjs/common';
import { IdPositivoPipe } from './id-positivo.pipe';
describe('Identificadores HTTP', () => {
  const pipe = new IdPositivoPipe();
  it('acepta un identificador positivo dentro del rango de MySQL', () => {
    expect(pipe.transform('42')).toBe(42);
  });
  it.each(['0', '-1', '1.5', 'hola', '1e2', '4294967296', ''])(
    'rechaza %s',
    (valor) => {
      expect(() => pipe.transform(valor)).toThrow(BadRequestException);
    },
  );
});
