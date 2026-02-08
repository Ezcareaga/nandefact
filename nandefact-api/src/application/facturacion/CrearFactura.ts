import { randomUUID } from 'node:crypto';
import type {
  TipoDocumento,
  CondicionPago,
  TasaIVA,
} from '../../domain/shared/types.js';
import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import { Factura } from '../../domain/factura/Factura.js';
import { ItemFactura } from '../../domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../domain/factura/NumeroFactura.js';
import { ComercioNoEncontradoError } from '../errors/ComercioNoEncontradoError.js';

/** Input DTO para crear una factura */
export interface CrearFacturaInput {
  comercioId: string;
  clienteId: string;
  tipoDocumento: TipoDocumento;
  condicionPago: CondicionPago;
  fechaEmision: Date;
  numero: string; // 7 dígitos
  items: Array<{
    productoId: string;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    tasaIVA: TasaIVA;
  }>;
}

/** Output DTO después de crear una factura */
export interface CrearFacturaOutput {
  facturaId: string;
  cdc: string;
  estado: string;
  totalBruto: number;
  totalIVA10: number;
  totalIVA5: number;
  totalExenta: number;
  totalIVA: number;
}

/** Caso de uso — Crear una nueva factura electrónica */
export class CrearFactura {
  constructor(
    private readonly deps: {
      facturaRepository: IFacturaRepository;
      comercioRepository: IComercioRepository;
    },
  ) {}

  async execute(input: CrearFacturaInput): Promise<CrearFacturaOutput> {
    // 1. Cargar comercio
    const comercio = await this.deps.comercioRepository.findById(input.comercioId);
    if (!comercio) {
      throw new ComercioNoEncontradoError(input.comercioId);
    }

    // 2. Generar UUID para la factura
    const facturaId = randomUUID();

    // 3. Crear NumeroFactura usando establecimiento y punto del comercio
    const numeroFactura = new NumeroFactura(
      comercio.establecimiento,
      comercio.puntoExpedicion,
      input.numero,
    );

    // 4. Crear instancia de Factura
    const factura = new Factura({
      id: facturaId,
      comercioId: input.comercioId,
      clienteId: input.clienteId,
      tipoDocumento: input.tipoDocumento,
      timbrado: comercio.timbrado,
      numeroFactura,
      tipoEmision: 1, // Normal
      condicionPago: input.condicionPago,
      fechaEmision: input.fechaEmision,
    });

    // 5. Agregar items
    for (const itemInput of input.items) {
      const item = new ItemFactura({
        descripcion: itemInput.descripcion,
        cantidad: itemInput.cantidad,
        precioUnitario: itemInput.precioUnitario,
        tasaIVA: itemInput.tasaIVA,
      });
      factura.agregarItem(item);
    }

    // 6. Generar CDC
    factura.generarCDC(comercio.ruc, comercio.tipoContribuyente);

    // 7. Guardar factura
    await this.deps.facturaRepository.save(factura);

    // 8. Retornar output DTO
    return {
      facturaId: factura.id,
      cdc: factura.cdc?.value ?? '',
      estado: factura.estado,
      totalBruto: factura.totalBruto,
      totalIVA10: factura.totalIVA10,
      totalIVA5: factura.totalIVA5,
      totalExenta: factura.totalExenta,
      totalIVA: factura.totalIVA,
    };
  }
}
