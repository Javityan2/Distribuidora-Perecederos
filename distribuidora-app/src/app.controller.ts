import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Publico } from './usuarios/decoradores/publico.decorator';
@Controller()
export class AppController {
  constructor(private readonly servicio: AppService) {}
  @Publico() @Get() getHello() {
    return this.servicio.getHello();
  }
}
