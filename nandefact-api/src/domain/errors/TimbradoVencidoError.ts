import { DomainError } from './DomainError.js';

export class TimbradoVencidoError extends DomainError {
  constructor(numero: string, fechaFin: Date) {
    super(`Timbrado ${numero} vencido el ${fechaFin.toISOString().split('T')[0]}`);
  }
}
