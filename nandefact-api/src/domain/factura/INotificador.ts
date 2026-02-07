/** Puerto — Envío de KuDE al cliente (ej: WhatsApp Cloud API) */
export interface INotificador {
  enviarKuDE(telefono: string, pdfBuffer: Buffer): Promise<void>;
}
