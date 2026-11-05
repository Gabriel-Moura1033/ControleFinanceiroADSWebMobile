import { Body, Controller, Get, Post } from '@nestjs/common';
import { CreateTransacaoDto } from './dto/create-transacao.dto';
import { TransacoesService } from './transacoes.service';

@Controller('transacoes')
export class TransacoesController {
  constructor(private readonly transacoesService: TransacoesService) {}

  @Post()
  create(@Body() dto: CreateTransacaoDto) {
    return this.transacoesService.create(dto);
  }

  @Get()
  findAll() {
    return this.transacoesService.findAllComMetricas();
  }
}
