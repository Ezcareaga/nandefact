/** Error de configuración SIFEN */
export class SifenConfigError extends Error {
  constructor(detalle: string) {
    super(`Configuración SIFEN inválida: ${detalle}`);
    this.name = this.constructor.name;
  }
}
