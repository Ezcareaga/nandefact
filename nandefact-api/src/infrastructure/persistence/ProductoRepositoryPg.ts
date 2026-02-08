import type { PrismaClient } from '@prisma/client';
import type { IProductoRepository } from '../../domain/producto/IProductoRepository.js';
import { Producto } from '../../domain/producto/Producto.js';
import type { TasaIVA } from '../../domain/shared/types.js';

/**
 * Implementación PostgreSQL del repositorio de productos.
 * Usa Prisma ORM para persistencia.
 * Mapea entre modelo de dominio (Producto) y modelo de Prisma.
 */
export class ProductoRepositoryPg implements IProductoRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(producto: Producto): Promise<void> {
    await this.prisma.producto.upsert({
      where: { id: producto.id },
      create: this.toPrismaCreate(producto),
      update: this.toPrismaUpdate(producto),
    });
  }

  async findById(id: string): Promise<Producto | null> {
    const row = await this.prisma.producto.findUnique({
      where: { id },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByComercio(
    comercioId: string,
    options?: {
      page?: number;
      pageSize?: number;
      soloActivos?: boolean;
    },
  ): Promise<{ productos: Producto[]; total: number }> {
    const page = options?.page ?? 1;
    const pageSize = options?.pageSize ?? 50;
    const soloActivos = options?.soloActivos ?? true;

    const where = {
      comercioId,
      ...(soloActivos ? { activo: true } : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.producto.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { nombre: 'asc' },
      }),
      this.prisma.producto.count({ where }),
    ]);

    return {
      productos: rows.map((row) => this.toDomain(row)),
      total,
    };
  }

  // --- Mappers: Domain → Prisma ---

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaCreate(producto: Producto) {
    return {
      id: producto.id,
      comercioId: producto.comercioId,
      nombre: producto.nombre,
      codigo: producto.codigo,
      precioUnitario: BigInt(producto.precioUnitario),
      unidadMedida: producto.unidadMedida,
      tasaIVA: producto.tasaIVA,
      categoria: producto.categoria,
      activo: producto.activo,
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaUpdate(producto: Producto) {
    return {
      nombre: producto.nombre,
      codigo: producto.codigo,
      precioUnitario: BigInt(producto.precioUnitario),
      unidadMedida: producto.unidadMedida,
      tasaIVA: producto.tasaIVA,
      categoria: producto.categoria,
      activo: producto.activo,
      updatedAt: new Date(),
    };
  }

  // --- Mapper: Prisma → Domain ---

  private toDomain(row: {
    id: string;
    comercioId: string;
    nombre: string;
    codigo: string | null;
    precioUnitario: bigint;
    unidadMedida: string;
    tasaIVA: number;
    categoria: string | null;
    activo: boolean;
  }): Producto {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props: any = {
      id: row.id,
      comercioId: row.comercioId,
      nombre: row.nombre,
      precioUnitario: Number(row.precioUnitario),
      unidadMedida: row.unidadMedida,
      tasaIVA: row.tasaIVA as TasaIVA,
      activo: row.activo,
    };

    // Solo agregar campos opcionales si tienen valor
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.codigo !== null) props.codigo = row.codigo;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.categoria !== null) props.categoria = row.categoria;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new Producto(props);
  }
}
