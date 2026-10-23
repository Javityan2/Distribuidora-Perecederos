import { describe, it, expect } from '@jest/globals';
import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const servicio = new PasswordService();

  it('verifica la contraseña correcta y rechaza otra', async () => {
    const password = 'ClaveSoloParaPruebas-123';
    const hash = await servicio.transformar(password);

    expect(hash).not.toBe(password);

    expect(
      await servicio.verificar(hash, password),
    ).toBe(true);

    expect(
      await servicio.verificar(hash, 'OtraClave'),
    ).toBe(false);
  });

  it('genera hashes diferentes para la misma contraseña', async () => {
    const password = 'ClaveSoloParaPruebas-123';

    const primero = await servicio.transformar(password);
    const segundo = await servicio.transformar(password);

    expect(primero).not.toBe(segundo);

    expect(
      await servicio.verificar(primero, password),
    ).toBe(true);

    expect(
      await servicio.verificar(segundo, password),
    ).toBe(true);
  });
});