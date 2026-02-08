import type { PrismaClient, RolUsuario as PrismaRolUsuario } from '@prisma/client';
import type { IUsuarioRepository } from '../../domain/usuario/IUsuarioRepository.js';
import { Usuario } from '../../domain/usuario/Usuario.js';
import type { RolUsuario } from '../../domain/shared/types.js';

/**
 * Implementación PostgreSQL del repositorio de usuarios.
 * Usa Prisma ORM para persistencia.
 * Mapea entre modelo de dominio (Usuario) y modelo de Prisma.
 */
export class UsuarioRepositoryPg implements IUsuarioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(usuario: Usuario): Promise<void> {
    await this.prisma.usuario.upsert({
      where: { id: usuario.id },
      create: this.toPrismaCreate(usuario),
      update: this.toPrismaUpdate(usuario),
    });
  }

  async findById(id: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({
      where: { id },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByTelefono(telefono: string): Promise<Usuario | null> {
    const row = await this.prisma.usuario.findUnique({
      where: { telefono },
    });

    return row ? this.toDomain(row) : null;
  }

  // --- Mappers: Domain → Prisma ---

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaCreate(usuario: Usuario) {
    return {
      id: usuario.id,
      comercioId: usuario.comercioId,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      pinHash: usuario.pinHash,
      rol: this.mapRolToPrisma(usuario.rol),
      activo: usuario.activo,
      intentosFallidos: usuario.intentosFallidos,
      bloqueadoHasta: usuario.bloqueadoHasta,
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaUpdate(usuario: Usuario) {
    return {
      nombre: usuario.nombre,
      pinHash: usuario.pinHash,
      rol: this.mapRolToPrisma(usuario.rol),
      activo: usuario.activo,
      intentosFallidos: usuario.intentosFallidos,
      bloqueadoHasta: usuario.bloqueadoHasta,
    };
  }

  // --- Mapper: Prisma → Domain ---

  private toDomain(row: {
    id: string;
    comercioId: string;
    nombre: string;
    telefono: string;
    pinHash: string;
    rol: PrismaRolUsuario;
    activo: boolean;
    intentosFallidos: number;
    bloqueadoHasta: Date | null;
  }): Usuario {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props: any = {
      id: row.id,
      comercioId: row.comercioId,
      nombre: row.nombre,
      telefono: row.telefono,
      pinHash: row.pinHash,
      rol: this.mapRolToDomain(row.rol),
      activo: row.activo,
      intentosFallidos: row.intentosFallidos,
    };

    // Solo agregar bloqueadoHasta si tiene valor
    if (row.bloqueadoHasta !== null) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      props.bloqueadoHasta = row.bloqueadoHasta;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new Usuario(props);
  }

  // --- Helpers de mapeo de rol ---

  private mapRolToPrisma(rol: RolUsuario): PrismaRolUsuario {
    // Domain 'dueño' → Prisma 'dueno' (sin tilde)
    return rol === 'dueño' ? 'dueno' : 'empleado';
  }

  private mapRolToDomain(rol: PrismaRolUsuario): RolUsuario {
    // Prisma 'dueno' → Domain 'dueño' (con tilde)
    return rol === 'dueno' ? 'dueño' : 'empleado';
  }
}
