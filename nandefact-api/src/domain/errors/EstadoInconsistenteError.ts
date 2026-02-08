import { DomainError } from './DomainError.js';

/** Error cuando se intenta una transición de estado inválida */
export class EstadoInconsistenteError extends DomainError {
  constructor(
    public readonly estadoActual: string,
    public readonly estadoDestino: string,
  ) {
    super(`Transición de estado inválida: ${estadoActual} → ${estadoDestino}`);
  }
}
