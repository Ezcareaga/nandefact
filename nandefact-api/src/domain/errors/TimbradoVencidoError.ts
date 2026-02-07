import { DomainError } from './DomainError.js';

export class TimbradoVencidoError extends DomainError {
  constructor(numero: string, fechaFin: Date) {
    const fecha = fechaFin.toISOString().split('T')[0] ?? '';
    super(`Timbrado ${numero} vencido el ${fecha}`);
  }
}
