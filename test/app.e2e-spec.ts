import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { TransacoesModule } from '../src/transacoes/transacoes.module';

// Usa um MongoDB em memória para não tocar no banco do Atlas
describe('Transacoes (e2e)', () => {
  let app: INestApplication;
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();

    const moduleRef = await Test.createTestingModule({
      imports: [MongooseModule.forRoot(mongo.getUri()), TransacoesModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongo.stop();
  });

  it('GET /transacoes retorna histórico vazio e métricas zeradas', () => {
    return request(app.getHttpServer())
      .get('/transacoes')
      .expect(200)
      .expect({
        historico: [],
        metricas: { saldoTotal: 0, totalDespesas: 0, totalGastoImpulso: 0 },
      });
  });

  it('POST /transacoes cadastra receitas e despesas', async () => {
    const transacoes = [
      { descricao: 'Salário', valor: 2500, tipo: 'receita', categoria: 'Trabalho', consumoConsciente: true },
      { descricao: 'Conta de Luz', valor: 180.35, tipo: 'despesa', categoria: 'Moradia', consumoConsciente: true },
      { descricao: 'Delivery', valor: 64.9, tipo: 'despesa', categoria: 'Alimentação', consumoConsciente: false },
      { descricao: 'Compra de Roupas', valor: 199.9, tipo: 'despesa', categoria: 'Lazer', consumoConsciente: false },
    ];

    for (const t of transacoes) {
      const res = await request(app.getHttpServer()).post('/transacoes').send(t).expect(201);
      expect(res.body).toMatchObject(t);
      expect(res.body._id).toBeDefined();
    }
  });

  it('GET /transacoes retorna o histórico com as métricas calculadas', async () => {
    const res = await request(app.getHttpServer()).get('/transacoes').expect(200);

    expect(res.body.historico).toHaveLength(4);
    expect(res.body.metricas).toEqual({
      saldoTotal: 2054.85,
      totalDespesas: 445.15,
      totalGastoImpulso: 264.8,
    });
  });

  it('POST /transacoes rejeita tipo inválido', () => {
    return request(app.getHttpServer())
      .post('/transacoes')
      .send({ descricao: 'Ações', valor: 100, tipo: 'investimento', categoria: 'Poupança' })
      .expect(400);
  });

  it('POST /transacoes rejeita valor negativo e campos ausentes', () => {
    return request(app.getHttpServer())
      .post('/transacoes')
      .send({ valor: -10, tipo: 'despesa' })
      .expect(400);
  });

  it('consumoConsciente assume true quando não informado', async () => {
    const res = await request(app.getHttpServer())
      .post('/transacoes')
      .send({ descricao: 'Livro do curso', valor: 45, tipo: 'despesa', categoria: 'Educação' })
      .expect(201);

    expect(res.body.consumoConsciente).toBe(true);
  });
});
