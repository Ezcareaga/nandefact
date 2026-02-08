import type { PrismaClient } from '@prisma/client';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import { Comercio } from '../../domain/comercio/Comercio.js';
import { RUC } from '../../domain/comercio/RUC.js';
import { Timbrado } from '../../domain/comercio/Timbrado.js';
import type { TipoContribuyente } from '../../domain/shared/types.js';

/**
 * Implementación PostgreSQL del repositorio de comercios.
 * Usa Prisma ORM para persistencia.
 * Mapea entre modelo de dominio (Comercio) y modelo de Prisma.
 */
export class ComercioRepositoryPg implements IComercioRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(comercio: Comercio): Promise<void> {
    // Upsert: crear o actualizar según si existe el id
    await this.prisma.comercio.upsert({
      where: { id: comercio.id },
      create: this.toPrismaCreate(comercio),
      update: this.toPrismaUpdate(comercio),
    });
  }

  async findById(id: string): Promise<Comercio | null> {
    const row = await this.prisma.comercio.findUnique({
      where: { id },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByRuc(ruc: string): Promise<Comercio | null> {
    const row = await this.prisma.comercio.findUnique({
      where: { ruc },
    });

    return row ? this.toDomain(row) : null;
  }

  // --- Mappers: Domain → Prisma ---

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaCreate(comercio: Comercio) {
    return {
      id: comercio.id,
      ruc: comercio.ruc.value,
      razonSocial: comercio.razonSocial,
      nombreFantasia: comercio.nombreFantasia,
      establecimiento: comercio.establecimiento,
      puntoExpedicion: comercio.puntoExpedicion,
      timbradoNumero: comercio.timbrado.numero,
      timbradoFechaInicio: comercio.timbrado.fechaInicio,
      timbradoFechaFin: comercio.timbrado.fechaFin,
      tipoContribuyente: comercio.tipoContribuyente as number,
      activo: comercio.activo,
      direccion: comercio.direccion,
      numeroCasa: comercio.numeroCasa,
      departamento: comercio.departamento,
      departamentoDesc: comercio.departamentoDesc,
      distrito: comercio.distrito,
      distritoDesc: comercio.distritoDesc,
      ciudad: comercio.ciudad,
      ciudadDesc: comercio.ciudadDesc,
      telefono: comercio.telefono,
      email: comercio.email,
      rubro: comercio.rubro,
      actividadEconomicaCodigo: comercio.actividadEconomicaCodigo,
      actividadEconomicaDesc: comercio.actividadEconomicaDesc,
      tipoRegimen: comercio.tipoRegimen,
      cscId: comercio.cscId,
    };
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  private toPrismaUpdate(comercio: Comercio) {
    return {
      razonSocial: comercio.razonSocial,
      nombreFantasia: comercio.nombreFantasia,
      establecimiento: comercio.establecimiento,
      puntoExpedicion: comercio.puntoExpedicion,
      timbradoNumero: comercio.timbrado.numero,
      timbradoFechaInicio: comercio.timbrado.fechaInicio,
      timbradoFechaFin: comercio.timbrado.fechaFin,
      tipoContribuyente: comercio.tipoContribuyente as number,
      activo: comercio.activo,
      direccion: comercio.direccion,
      numeroCasa: comercio.numeroCasa,
      departamento: comercio.departamento,
      departamentoDesc: comercio.departamentoDesc,
      distrito: comercio.distrito,
      distritoDesc: comercio.distritoDesc,
      ciudad: comercio.ciudad,
      ciudadDesc: comercio.ciudadDesc,
      telefono: comercio.telefono,
      email: comercio.email,
      rubro: comercio.rubro,
      actividadEconomicaCodigo: comercio.actividadEconomicaCodigo,
      actividadEconomicaDesc: comercio.actividadEconomicaDesc,
      tipoRegimen: comercio.tipoRegimen,
      cscId: comercio.cscId,
      updatedAt: new Date(),
    };
  }

  // --- Mapper: Prisma → Domain ---

  private toDomain(row: {
    id: string;
    ruc: string;
    razonSocial: string;
    nombreFantasia: string;
    establecimiento: string;
    puntoExpedicion: string;
    timbradoNumero: string;
    timbradoFechaInicio: Date;
    timbradoFechaFin: Date;
    tipoContribuyente: number;
    activo: boolean;
    direccion: string | null;
    numeroCasa: string | null;
    departamento: number | null;
    departamentoDesc: string | null;
    distrito: number | null;
    distritoDesc: string | null;
    ciudad: number | null;
    ciudadDesc: string | null;
    telefono: string | null;
    email: string | null;
    rubro: string | null;
    actividadEconomicaCodigo: string | null;
    actividadEconomicaDesc: string | null;
    tipoRegimen: number | null;
    cscId: string | null;
  }): Comercio {
    const ruc = new RUC(row.ruc);
    const timbrado = new Timbrado(
      row.timbradoNumero,
      row.timbradoFechaInicio,
      row.timbradoFechaFin,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const props: any = {
      id: row.id,
      ruc,
      razonSocial: row.razonSocial,
      nombreFantasia: row.nombreFantasia,
      timbrado,
      establecimiento: row.establecimiento,
      puntoExpedicion: row.puntoExpedicion,
      tipoContribuyente: row.tipoContribuyente as TipoContribuyente,
      activo: row.activo,
    };

    // Solo agregar campos opcionales si tienen valor
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.direccion !== null) props.direccion = row.direccion;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.numeroCasa !== null) props.numeroCasa = row.numeroCasa;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.departamento !== null) props.departamento = row.departamento;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.departamentoDesc !== null) props.departamentoDesc = row.departamentoDesc;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.distrito !== null) props.distrito = row.distrito;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.distritoDesc !== null) props.distritoDesc = row.distritoDesc;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.ciudad !== null) props.ciudad = row.ciudad;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.ciudadDesc !== null) props.ciudadDesc = row.ciudadDesc;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.telefono !== null) props.telefono = row.telefono;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.email !== null) props.email = row.email;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.rubro !== null) props.rubro = row.rubro;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.actividadEconomicaCodigo !== null) props.actividadEconomicaCodigo = row.actividadEconomicaCodigo;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.actividadEconomicaDesc !== null) props.actividadEconomicaDesc = row.actividadEconomicaDesc;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.tipoRegimen !== null) props.tipoRegimen = row.tipoRegimen;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (row.cscId !== null) props.cscId = row.cscId;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return new Comercio(props);
  }
}
