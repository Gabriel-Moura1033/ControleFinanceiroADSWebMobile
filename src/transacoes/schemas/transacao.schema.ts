import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export const TIPOS_TRANSACAO = ['receita', 'despesa'] as const;
export type TipoTransacao = (typeof TIPOS_TRANSACAO)[number];

export type TransacaoDocument = HydratedDocument<Transacao>;

@Schema({ timestamps: true, collection: 'transacoes' })
export class Transacao {
  // Ex: "Conta de Luz", "Compra de Roupas"
  @Prop({ type: String, required: true, trim: true })
  descricao: string;

  @Prop({ type: Number, required: true, min: 0 })
  valor: number;

  // Aceita apenas "receita" ou "despesa"
  @Prop({ type: String, required: true, enum: TIPOS_TRANSACAO })
  tipo: TipoTransacao;

  // Ex: "Moradia", "Alimentação", "Lazer", "Educação"
  @Prop({ type: String, required: true, trim: true })
  categoria: string;

  // true = gasto essencial/planejado; false = gasto por impulso (ODS 12)
  @Prop({ type: Boolean, required: true, default: true })
  consumoConsciente: boolean;
}

export const TransacaoSchema = SchemaFactory.createForClass(Transacao);
