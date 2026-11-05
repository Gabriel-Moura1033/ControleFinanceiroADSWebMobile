import { jest } from '@jest/globals';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { Transacao } from './schemas/transacao.schema';
import { TransacoesService } from './transacoes.service';

describe('TransacoesService', () => {
  let service: TransacoesService;
  let dados: Partial<Transacao>[];

  // Simula a cadeia find().sort().lean().exec() do Mongoose
  const modelMock = {
    create: jest.fn((dto) => Promise.resolve({ _id: 'abc', ...dto })),
    find: jest.fn(() => ({
      sort: () => ({ lean: () => ({ exec: () => Promise.resolve(dados) }) }),
    })),
  };

  beforeEach(async () => {
    dados = [];
    const moduleRef = await Test.createTestingModule({
      providers: [
        TransacoesService,
        { provide: getModelToken(Transacao.name), useValue: modelMock },
      ],
    }).compile();

    service = moduleRef.get(TransacoesService);
  });

  it('cria uma transação', async () => {
    const dto = {
      descricao: 'Conta de Luz',
      valor: 180.35,
      tipo: 'despesa' as const,
      categoria: 'Moradia',
      consumoConsciente: true,
    };
    await expect(service.create(dto)).resolves.toMatchObject(dto);
    expect(modelMock.create).toHaveBeenCalledWith(dto);
  });

  it('retorna métricas zeradas quando não há transações', async () => {
    await expect(service.findAllComMetricas()).resolves.toEqual({
      historico: [],
      metricas: { saldoTotal: 0, totalDespesas: 0, totalGastoImpulso: 0 },
    });
  });

  it('calcula saldoTotal, totalDespesas e totalGastoImpulso', async () => {
    dados = [
      { descricao: 'Salário', valor: 2500, tipo: 'receita', categoria: 'Trabalho', consumoConsciente: true },
      { descricao: 'Conta de Luz', valor: 180.35, tipo: 'despesa', categoria: 'Moradia', consumoConsciente: true },
      { descricao: 'Delivery', valor: 64.9, tipo: 'despesa', categoria: 'Alimentação', consumoConsciente: false },
      { descricao: 'Compra de Roupas', valor: 199.9, tipo: 'despesa', categoria: 'Lazer', consumoConsciente: false },
    ];

    const { historico, metricas } = await service.findAllComMetricas();

    expect(historico).toHaveLength(4);
    expect(metricas).toEqual({
      saldoTotal: 2054.85,
      totalDespesas: 445.15,
      totalGastoImpulso: 264.8,
    });
  });

  it('não conta receitas como gasto por impulso', async () => {
    dados = [
      { descricao: 'Venda de bazar', valor: 100, tipo: 'receita', categoria: 'Renda extra', consumoConsciente: false },
    ];

    const { metricas } = await service.findAllComMetricas();

    expect(metricas).toEqual({ saldoTotal: 100, totalDespesas: 0, totalGastoImpulso: 0 });
  });

  it('permite saldo negativo quando as despesas superam as receitas', async () => {
    dados = [
      { descricao: 'Mesada', valor: 50, tipo: 'receita', categoria: 'Renda', consumoConsciente: true },
      { descricao: 'Parcela do cartão', valor: 120, tipo: 'despesa', categoria: 'Dívidas', consumoConsciente: true },
    ];

    const { metricas } = await service.findAllComMetricas();

    expect(metricas.saldoTotal).toBe(-70);
  });
});
