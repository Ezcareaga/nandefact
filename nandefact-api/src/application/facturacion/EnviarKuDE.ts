import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import type { IKudeGenerator } from '../../domain/factura/IKudeGenerator.js';
import type { INotificador } from '../../domain/factura/INotificador.js';
import { FacturaNoEncontradaError } from '../../domain/errors/FacturaNoEncontradaError.js';

export interface EnviarKuDEInput {
  facturaId: string;
}

export interface EnviarKuDEOutput {
  pdfGenerado: boolean;
  notificacionEnviada: boolean;
  telefono: string | null;
}

/**
 * Caso de Uso — Generar PDF KuDE y enviarlo al cliente vía WhatsApp.
 *
 * Flow:
 * 1. Validar que factura existe y está aprobada o cancelada
 * 2. Cargar comercio y cliente
 * 3. Generar PDF usando IKudeGenerator
 * 4. Si cliente tiene telefono + enviarWhatsApp → enviar via INotificador
 * 5. Retornar resultado
 */
export class EnviarKuDE {
  constructor(
    private facturaRepository: IFacturaRepository,
    private comercioRepository: IComercioRepository,
    private clienteRepository: IClienteRepository,
    private kudeGenerator: IKudeGenerator,
    private notificador: INotificador
  ) {}

  async ejecutar(input: EnviarKuDEInput): Promise<EnviarKuDEOutput> {
    // 1. Cargar factura
    const factura = await this.facturaRepository.findById(input.facturaId);
    if (!factura) {
      throw new FacturaNoEncontradaError(input.facturaId);
    }

    // 2. Validar estado (solo aprobada o cancelada puede generar KuDE)
    if (factura.estado !== 'aprobado' && factura.estado !== 'cancelado') {
      throw new Error(
        `No se puede generar KuDE para factura en estado "${factura.estado}". Debe estar aprobada o cancelada.`
      );
    }

    // 3. Validar CDC (requerido para QR)
    if (!factura.cdc) {
      throw new Error('No se puede generar KuDE sin CDC. La factura debe tener CDC asignado.');
    }

    // 4. Cargar comercio
    const comercio = await this.comercioRepository.findById(factura.comercioId);
    if (!comercio) {
      throw new Error(`Comercio no encontrado: ${factura.comercioId}`);
    }

    // 5. Cargar cliente
    const cliente = await this.clienteRepository.findById(factura.clienteId);
    if (!cliente) {
      throw new Error(`Cliente no encontrado: ${factura.clienteId}`);
    }

    // 6. Generar PDF
    const pdfBuffer = await this.kudeGenerator.generar(factura, comercio, cliente);

    // 7. Enviar notificación si cliente tiene telefono y flag activado
    let notificacionEnviada = false;
    if (cliente.telefono && cliente.enviarWhatsApp) {
      await this.notificador.enviarKuDE(cliente.telefono, pdfBuffer);
      notificacionEnviada = true;
    }

    return {
      pdfGenerado: true,
      notificacionEnviada,
      telefono: cliente.telefono
    };
  }
}
