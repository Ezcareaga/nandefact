/** Error para métodos SIFEN pendientes de implementación */
export class SifenNoImplementadoError extends Error {
  constructor(metodo: string) {
    super(`${metodo} no implementado - pendiente integración real SIFEN`);
    this.name = this.constructor.name;
  }
}
