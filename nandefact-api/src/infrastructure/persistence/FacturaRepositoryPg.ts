import type {
  PrismaClient,
  EstadoSifen as PrismaEstadoSifen,
  CondicionPago as PrismaCondicionPago,
} from '@prisma/client';
import type { IFacturaRepository } from '../../domain/factura/IFacturaRepository.js';
import { Factura } from '../../domain/factura/Factura.js';
import { ItemFactura } from '../../domain/factura/ItemFactura.js';
import { CDC } from '../../domain/factura/CDC.js';
import { NumeroFactura } from '../../domain/factura/NumeroFactura.js';
import { Timbrado } from '../../domain/comercio/Timbrado.js';
import type {
  EstadoSifen,
  CondicionPago,
  TipoDocumento,
  TipoEmision,
  TasaIVA,
} from '../../domain/shared/types.js';

/**
 * Implementación PostgreSQL del repositorio de facturas.
 * Usa Prisma ORM para persistencia.
 * Mapea entre modelo de dominio (Factura) y modelo de Prisma.
 *
 * IMPORTANTE: La factura tiene estado privado (_items, _cdc, _estado).
 * Para reconstruir desde DB sin ejecutar validaciones del constructor,
 * usamos un patrón especial con reflection/Object.assign.
 */
export class FacturaRepositoryPg implements IFacturaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(factura: Factura): Promise<void> {
    // Save en transacción: factura + detalles
    await this.prisma.$transaction(async (tx) => {
      // Upsert factura
      await tx.factura.upsert({
        where: { id: factura.id },
        create: this.toPrismaCreate(factura),
        update: this.toPrismaUpdate(factura),
      });

      // Delete existing detalles (si es update) y recrear
      await tx.facturaDetalle.deleteMany({
        where: { facturaId: factura.id },
      });

      // Insert new detalles
      if (factura.items.length > 0) {
        await tx.facturaDetalle.createMany({
          data: factura.items.map((item, index) => this.itemToPrisma(factura.id, item, index)),
        });
      }
    });
  }

  async findById(id: string): Promise<Factura | null> {
    const row = await this.prisma.factura.findUnique({
      where: { id },
      include: { detalles: true },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByComercio(comercioId: string): Promise<Factura[]> {
    const rows = await this.prisma.factura.findMany({
      where: { comercioId },
      include: { detalles: true },
      orderBy: { createdAt: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async findPendientes(comercioId: string): Promise<Factura[]> {
    const rows = await this.prisma.factura.findMany({
      where: {
        comercioId,
        estadoSifen: 'pendiente',
      },
      include: { detalles: true },
      orderBy: { createdAt: 'asc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  // --- Mappers: Domain → Prisma ---

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaCreate(factura: Factura) {
    return {
      id: factura.id,
      comercioId: factura.comercioId,
      usuarioId: null, // TODO: agregar cuando tengamos usuarioId en Factura
      clienteId: factura.clienteId,
      cdc: factura.cdc?.value ?? null,
      numero: BigInt(factura.numeroFactura.numero),
      tipoDocumento: factura.tipoDocumento,
      establecimiento: factura.numeroFactura.establecimiento,
      puntoExpedicion: factura.numeroFactura.punto,
      tipoEmision: factura.tipoEmision,
      condicionPago: factura.condicionPago as PrismaCondicionPago,
      fechaEmision: factura.fechaEmision,
      timbradoNumero: factura.timbrado.numero,
      timbradoFechaInicio: factura.timbrado.fechaInicio,
      timbradoFechaFin: factura.timbrado.fechaFin,
      totalBruto: BigInt(factura.totalBruto),
      totalIVA10: BigInt(factura.totalIVA10),
      totalIVA5: BigInt(factura.totalIVA5),
      totalExenta: BigInt(factura.totalExenta),
      totalIVA: BigInt(factura.totalIVA),
      estadoSifen: factura.estado as PrismaEstadoSifen,
      sifenRespuesta: null,
      sifenCodigoRespuesta: null,
      sifenFechaEnvio: null,
      sifenFechaAprobacion: null,
      whatsappEnviado: false,
      whatsappFecha: null,
      kudePdfPath: null,
      syncId: null,
      createdOffline: false,
      syncedAt: null,
      facturaReferenciaId: null,
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaUpdate(factura: Factura) {
    return {
      cdc: factura.cdc?.value ?? null,
      totalBruto: BigInt(factura.totalBruto),
      totalIVA10: BigInt(factura.totalIVA10),
      totalIVA5: BigInt(factura.totalIVA5),
      totalExenta: BigInt(factura.totalExenta),
      totalIVA: BigInt(factura.totalIVA),
      estadoSifen: factura.estado as PrismaEstadoSifen,
      updatedAt: new Date(),
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private itemToPrisma(facturaId: string, item: ItemFactura, index: number) {
    // Generar ID determinístico para el detalle
    const detalleId = `${facturaId}-${String(index)}`;

    return {
      id: detalleId,
      facturaId,
      productoId: null, // Snapshot sin FK
      descripcion: item.descripcion,
      cantidad: BigInt(item.cantidad),
      precioUnitario: BigInt(item.precioUnitario),
      subtotal: BigInt(item.subtotal),
      ivaTipo: this.mapIvaTipo(item.tasaIVA),
      ivaTasa: item.tasaIVA,
      ivaProporcion: 100, // Por ahora siempre 100%
      ivaBase: BigInt(item.iva.baseGravada),
      ivaMonto: BigInt(item.iva.montoIVACalculado),
    };
  }

  // --- Mapper: Prisma → Domain ---

  private toDomain(row: {
    id: string;
    comercioId: string;
    clienteId: string;
    cdc: string | null;
    numero: bigint;
    tipoDocumento: number;
    establecimiento: string;
    puntoExpedicion: string;
    tipoEmision: number;
    condicionPago: PrismaCondicionPago;
    fechaEmision: Date;
    timbradoNumero: string;
    timbradoFechaInicio: Date;
    timbradoFechaFin: Date;
    totalBruto: bigint;
    totalIVA10: bigint;
    totalIVA5: bigint;
    totalExenta: bigint;
    totalIVA: bigint;
    estadoSifen: PrismaEstadoSifen;
    detalles: Array<{
      descripcion: string;
      cantidad: bigint;
      precioUnitario: bigint;
      subtotal: bigint;
      ivaTasa: number;
    }>;
  }): Factura {
    // Crear factura base con constructor
    const timbrado = new Timbrado(
      row.timbradoNumero,
      row.timbradoFechaInicio,
      row.timbradoFechaFin,
    );

    const numeroFactura = new NumeroFactura(
      row.establecimiento,
      row.puntoExpedicion,
      Number(row.numero).toString().padStart(7, '0'),
    );

    const factura = new Factura({
      id: row.id,
      comercioId: row.comercioId,
      clienteId: row.clienteId,
      tipoDocumento: row.tipoDocumento as TipoDocumento,
      timbrado,
      numeroFactura,
      tipoEmision: row.tipoEmision as TipoEmision,
      condicionPago: row.condicionPago as CondicionPago,
      fechaEmision: row.fechaEmision,
    });

    // Reconstruir items
    const items = row.detalles.map(
      (detalle) =>
        new ItemFactura({
          descripcion: detalle.descripcion,
          cantidad: Number(detalle.cantidad),
          precioUnitario: Number(detalle.precioUnitario),
          tasaIVA: detalle.ivaTasa as TasaIVA,
        }),
    );

    // Inyectar estado privado usando reflection (bypass validaciones)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (factura as any)._items = items;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (factura as any)._cdc = row.cdc ? new CDC(row.cdc) : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (factura as any)._estado = row.estadoSifen as EstadoSifen;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (factura as any)._totalBruto = Number(row.totalBruto);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (factura as any)._totalIVA10 = Number(row.totalIVA10);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (factura as any)._totalIVA5 = Number(row.totalIVA5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (factura as any)._totalExenta = Number(row.totalExenta);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    (factura as any)._totalIVA = Number(row.totalIVA);

    return factura;
  }

  // --- Helpers ---

  private mapIvaTipo(tasaIVA: TasaIVA): number {
    // 1=Gravado, 2=Parcialmente exento, 3=Exento
    if (tasaIVA === 10 || tasaIVA === 5) return 1;
    return 3;
  }
}
