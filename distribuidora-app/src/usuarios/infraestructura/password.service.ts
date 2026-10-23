import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';

@Injectable()
export class PasswordService {
  transformar(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
    });
  }

  verificar(
    hashGuardado: string,
    passwordIngresado: string,
  ): Promise<boolean> {
    return argon2.verify(hashGuardado, passwordIngresado);
  }
}