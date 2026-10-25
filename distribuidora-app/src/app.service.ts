import { Injectable } from '@nestjs/common';
@Injectable()
export class AppService {
  getHello() {
    return { servicio: 'Distribuidora de perecederos', estado: 'disponible' };
  }
}
