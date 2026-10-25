import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  private hashDeComparacion?: Promise<string>;
  transformar(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }
  verificar(hashGuardado: string, passwordIngresado: string): Promise<boolean> {
    return argon2.verify(hashGuardado, passwordIngresado);
  }
  async verificarCredencial(
    hash: string | undefined,
    password: string,
  ): Promise<boolean> {
    // La comparación también se ejecuta cuando el correo no existe.
    this.hashDeComparacion ??= this.transformar(
      'comparacion-interna-sin-cuenta',
    );
    const coincide = await this.verificar(
      hash ?? (await this.hashDeComparacion),
      password,
    );
    return hash !== undefined && coincide;
  }
}
