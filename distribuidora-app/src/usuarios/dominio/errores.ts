import { ErrorDeDominio } from '../../dominio/error-de-dominio';

export class UsuarioNoEncontradoError extends ErrorDeDominio {
  constructor(id: number) {
    super(`No existe el usuario ${id}`);
  }
}

export class UsuarioInactivoError extends ErrorDeDominio {
  constructor(id: number) {
    super(`El usuario ${id} esta inactivo`);
  }
}
