// Ningun error de aqui menciona un codigo HTTP. Eso lo decide el
// Controller: el dominio solo reporta que paso.

export class UsuarioNoEncontradoError extends Error {
  constructor(Id: number) {
    super(`No existe el usuario ${Id}`);
  }
}

export class UsuarioInactivoError extends Error {
  constructor(Id: number) {
    super(`El usuario ${Id} esta inactivo`);
  }
}
