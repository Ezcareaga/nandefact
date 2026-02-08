import type { PrismaClient, TipoDocumentoIdentidad as PrismaTipoDoc } from '@prisma/client';
import type { IClienteRepository } from '../../domain/cliente/IClienteRepository.js';
import { Cliente } from '../../domain/cliente/Cliente.js';
import type { TipoDocumentoIdentidad } from '../../domain/shared/types.js';

/**
 * Implementación PostgreSQL del repositorio de clientes.
 * Usa Prisma ORM para persistencia.
 * Mapea entre modelo de dominio (Cliente) y modelo de Prisma.
 */
export class ClienteRepositoryPg implements IClienteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(cliente: Cliente): Promise<void> {
    await this.prisma.cliente.upsert({
      where: { id: cliente.id },
      create: this.toPrismaCreate(cliente),
      update: this.toPrismaUpdate(cliente),
    });
  }

  async findById(id: string): Promise<Cliente | null> {
    const row = await this.prisma.cliente.findUnique({
      where: { id },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByComercio(comercioId: string): Promise<Cliente[]> {
    const rows = await this.prisma.cliente.findMany({
      where: { comercioId },
      orderBy: { nombre: 'asc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async buscar(comercioId: string, query: string): Promise<Cliente[]> {
    const rows = await this.prisma.cliente.findMany({
      where: {
        comercioId,
        OR: [
          { nombre: { contains: query, mode: 'insensitive' } },
          { rucCi: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { frecuente: 'desc' },
    });

    return rows.map((row) => this.toDomain(row));
  }

  // --- Mappers: Domain → Prisma ---

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaCreate(cliente: Cliente) {
    return {
      id: cliente.id,
      comercioId: cliente.comercioId,
      nombre: cliente.nombre,
      rucCi: cliente.rucCi,
      tipoDocumento: cliente.tipoDocumento as PrismaTipoDoc,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      frecuente: cliente.frecuente,
      enviarWhatsApp: cliente.enviarWhatsApp,
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaUpdate(cliente: Cliente) {
    return {
      nombre: cliente.nombre,
      rucCi: cliente.rucCi,
      tipoDocumento: cliente.tipoDocumento as PrismaTipoDoc,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
      frecuente: cliente.frecuente,
      enviarWhatsApp: cliente.enviarWhatsApp,
    };
  }

  // --- Mapper: Prisma → Domain ---

  private toDomain(row: {
    id: string;
    comercioId: string;
    nombre: string;
    rucCi: string;
    tipoDocumento: PrismaTipoDoc;
    telefono: string | null;
    email: string | null;
    direccion: string | null;
    frecuente: boolean;
    enviarWhatsApp: boolean;
  }): Cliente {
    return new Cliente({
      id: row.id,
      comercioId: row.comercioId,
      nombre: row.nombre,
      rucCi: row.rucCi,
      tipoDocumento: row.tipoDocumento as TipoDocumentoIdentidad,
      telefono: row.telefono ?? undefined,
      email: row.email ?? undefined,
      direccion: row.direccion ?? undefined,
      frecuente: row.frecuente,
      enviarWhatsApp: row.enviarWhatsApp,
    });
  }
}
