import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import type { IKudeGenerator } from '../../domain/factura/IKudeGenerator.js';
import type { INotificador } from '../../domain/factura/INotificador.js';
import { FacturaNoEncontradaError } from '../errors/FacturaNoEncontradaError.js';
import { KuDENoGenerableError } from '../errors/KuDENoGenerableError.js';
import { ComercioNoEncontradoError } from '../errors/ComercioNoEncontradoError.js';
import { ClienteNoEncontradoError } from '../errors/ClienteNoEncontradoError.js';
import { CDCSinGenerarError } from '../../domain/errors/CDCSinGenerarError.js';

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
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      comercioRepository: IComercioRepository;
      clienteRepository: IClienteRepository;
      kudeGenerator: IKudeGenerator;
      notificador: INotificador;
    }
  ) {}

  async execute(input: EnviarKuDEInput): Promise<EnviarKuDEOutput> {
    // 1. Cargar factura
    const factura = await this.deps.facturaRepository.findById(input.facturaId);
    if (!factura) {
      throw new FacturaNoEncontradaError(input.facturaId);
    }

    // 2. Validar estado (solo aprobada o cancelada puede generar KuDE)
    if (factura.estado !== 'aprobado' && factura.estado !== 'cancelado') {
      throw new KuDENoGenerableError(
        `factura en estado "${factura.estado}". Debe estar aprobada o cancelada.`,
      );
    }

    // 3. Validar CDC (requerido para QR)
    if (!factura.cdc) {
      throw new CDCSinGenerarError(input.facturaId);
    }

    // 4. Cargar comercio
    const comercio = await this.deps.comercioRepository.findById(factura.comercioId);
    if (!comercio) {
      throw new ComercioNoEncontradoError(factura.comercioId);
    }

    // 5. Cargar cliente
    const cliente = await this.deps.clienteRepository.findById(factura.clienteId);
    if (!cliente) {
      throw new ClienteNoEncontradoError(factura.clienteId);
    }

    // 6. Generar PDF
    const pdfBuffer = await this.deps.kudeGenerator.generar(factura, comercio, cliente);

    // 7. Enviar notificación si cliente tiene telefono y flag activado
    let notificacionEnviada = false;
    if (cliente.telefono && cliente.enviarWhatsApp) {
      await this.deps.notificador.enviarKuDE(cliente.telefono, pdfBuffer);
      notificacionEnviada = true;
    }

    return {
      pdfGenerado: true,
      notificacionEnviada,
      telefono: cliente.telefono
    };
  }
}
