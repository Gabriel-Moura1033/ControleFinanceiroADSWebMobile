import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateTransacaoDto } from './dto/create-transacao.dto';
import { Transacao, TransacaoDocument } from './schemas/transacao.schema';

export interface Metricas {
  saldoTotal: number;
  totalDespesas: number;
  totalGastoImpulso: number;
}

export interface ResumoTransacoes {
  historico: Transacao[];
  metricas: Metricas;
}

// Evita resíduos de ponto flutuante (ex: 0.1 + 0.2)
const arredondar = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class TransacoesService {
  constructor(
    @InjectModel(Transacao.name)
    private readonly transacaoModel: Model<TransacaoDocument>,
  ) {}

  async create(dto: CreateTransacaoDto): Promise<Transacao> {
    return this.transacaoModel.create(dto);
  }

  async findAllComMetricas(): Promise<ResumoTransacoes> {
    const historico = await this.transacaoModel
      .find()
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return { historico, metricas: this.calcularMetricas(historico) };
  }

  private calcularMetricas(transacoes: Transacao[]): Metricas {
    let totalReceitas = 0;
    let totalDespesas = 0;
    let totalGastoImpulso = 0;

    for (const t of transacoes) {
      if (t.tipo === 'receita') {
        totalReceitas += t.valor;
      } else {
        totalDespesas += t.valor;
        if (!t.consumoConsciente) totalGastoImpulso += t.valor;
      }
    }

    return {
      saldoTotal: arredondar(totalReceitas - totalDespesas),
      totalDespesas: arredondar(totalDespesas),
      totalGastoImpulso: arredondar(totalGastoImpulso),
    };
  }
}
