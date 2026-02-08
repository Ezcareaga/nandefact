import type { INotificador } from '../../domain/factura/INotificador.js';

/**
 * Adaptador Stub — INotificador que solo registra en consola.
 * NO envía realmente a WhatsApp. Es un placeholder hasta implementar WhatsAppNotificador.
 *
 * Per KUDE-02 requirement: stub implementation que loguea en lugar de enviar.
 */
export class NotificadorStub implements INotificador {
  enviarKuDE(telefono: string, pdfBuffer: Buffer): Promise<void> {
    const bufferSize = pdfBuffer.length.toString();
    console.log(`[NotificadorStub] KuDE enviado a ${telefono} (${bufferSize} bytes)`);
    return Promise.resolve();
  }
}
