# API de Controle Financeiro Pessoal

API RESTful construída com **NestJS** e **MongoDB (Atlas)** que funciona como motor de um aplicativo de controle financeiro pessoal. Pode servir de apoio em oficinas comunitárias de **letramento financeiro**, alinhada aos Objetivos de Desenvolvimento Sustentável:

- **ODS 1 – Erradicação da pobreza:** ajuda famílias a enxergar o saldo real e a prevenir o superendividamento.
- **ODS 12 – Consumo e produção responsáveis:** o campo `consumoConsciente` leva a pessoa a refletir se cada despesa foi essencial ou um gasto por impulso.

## Tecnologias

- NestJS
- MongoDB Atlas + `@nestjs/mongoose`
- `class-validator` para validar os dados de entrada
- `@nestjs/config` para variáveis de ambiente

## Estrutura

```
src/
├── main.ts                      # Bootstrap + ValidationPipe global
├── app.module.ts                # Conexão com o MongoDB (MONGODB_URI)
└── transacoes/
    ├── transacoes.service.spec.ts # Testes unitários
    ├── schemas/transacao.schema.ts
    ├── dto/create-transacao.dto.ts
    ├── transacoes.controller.ts # Rotas POST e GET /transacoes
    ├── transacoes.service.ts    # Regras de negócio e cálculo das métricas
    └── transacoes.module.ts
test/
├── app.e2e-spec.ts              # Testes e2e (MongoDB em memória)
└── jest-e2e.json
```

## Schema `Transacao`

| Campo               | Tipo    | Descrição                                                    |
|---------------------|---------|--------------------------------------------------------------|
| `descricao`         | String  | Ex: "Conta de Luz", "Compra de Roupas"                       |
| `valor`             | Number  | Valor monetário (positivo)                                   |
| `tipo`              | String  | Apenas `"receita"` ou `"despesa"`                            |
| `categoria`         | String  | Ex: "Moradia", "Alimentação", "Lazer", "Educação"            |
| `consumoConsciente` | Boolean | `true` = gasto essencial/planejado, `false` = gasto por impulso (padrão: `true`) |

Os campos `createdAt` e `updatedAt` são gerados automaticamente.

## Como executar

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Crie um cluster gratuito no [MongoDB Atlas](https://www.mongodb.com/atlas), crie um usuário do banco e libere seu IP em *Network Access*.
3. Copie o arquivo de exemplo e preencha a string de conexão:
   ```bash
   cp .env.example .env
   ```
   ```
   MONGODB_URI=mongodb+srv://<usuario>:<senha>@<cluster>.mongodb.net/controle-financeiro?retryWrites=true&w=majority
   PORT=3000
   ```
4. Inicie a API:
   ```bash
   npm run start:dev
   ```

## Endpoints

### `POST /transacoes`

Cadastra uma nova receita ou despesa.

```json
{
  "descricao": "Delivery no fim de semana",
  "valor": 64.90,
  "tipo": "despesa",
  "categoria": "Alimentação",
  "consumoConsciente": false
}
```

Dados inválidos (ex: `tipo` diferente de receita/despesa, valor negativo) retornam **400 Bad Request**.

### `GET /transacoes`

Retorna o histórico e as métricas calculadas no Service:

```json
{
  "historico": [ { "descricao": "Salário", "valor": 2500, "tipo": "receita", "...": "..." } ],
  "metricas": {
    "saldoTotal": 2054.85,
    "totalDespesas": 445.15,
    "totalGastoImpulso": 264.8
  }
}
```

- **saldoTotal:** soma das receitas menos a soma das despesas.
- **totalDespesas:** soma de todas as transações do tipo `"despesa"`.
- **totalGastoImpulso:** soma das despesas com `consumoConsciente: false`, mostrando o peso dos gastos não essenciais.

O arquivo [`requests.http`](requests.http) traz exemplos prontos (extensão REST Client do VS Code) com práticas de consumo consciente: despesas essenciais, delivery, compras não planejadas etc.

## Testes

```bash
npm test          # testes unitários do Service (cálculo das métricas)
npm run test:e2e  # testes ponta a ponta das rotas POST e GET /transacoes
npm run test:cov  # cobertura
```

Os testes e2e sobem um MongoDB em memória (`mongodb-memory-server`), então não gravam nada no Atlas.

## Impacto na comunidade

A ferramenta permite registrar e visualizar hábitos financeiros do dia a dia, ajudando a diferenciar necessidades reais de compras por impulso, a cortar o "dinheiro invisível" dos pequenos gastos diários e a melhorar a saúde financeira das famílias.
