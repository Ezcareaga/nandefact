import { randomUUID } from 'node:crypto';
import type { TipoContribuyente } from '../../domain/shared/types.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import { Comercio, type ComercioProps } from '../../domain/comercio/Comercio.js';
import { RUC } from '../../domain/comercio/RUC.js';
import { Timbrado } from '../../domain/comercio/Timbrado.js';
import { RucDuplicadoError } from '../errors/RucDuplicadoError.js';

/** Input DTO para registrar un comercio */
export interface RegistrarComercioInput {
  ruc: string;
  razonSocial: string;
  nombreFantasia: string;
  timbradoNumero: string;
  timbradoFechaInicio: Date;
  timbradoFechaFin: Date;
  establecimiento: string;
  puntoExpedicion: string;
  tipoContribuyente: TipoContribuyente;
  // Campos opcionales SIFEN
  direccion?: string;
  numeroCasa?: string;
  departamento?: number;
  departamentoDesc?: string;
  distrito?: number;
  distritoDesc?: string;
  ciudad?: number;
  ciudadDesc?: string;
  telefono?: string;
  email?: string;
  rubro?: string;
  actividadEconomicaCodigo?: string;
  actividadEconomicaDesc?: string;
  tipoRegimen?: number;
  cscId?: string;
}

/** Output DTO después de registrar un comercio */
export interface RegistrarComercioOutput {
  comercioId: string;
}

/** Caso de uso — Registrar un nuevo comercio */
export class RegistrarComercio {
  constructor(
    private readonly deps: {
      comercioRepository: IComercioRepository;
    },
  ) {}

  async execute(input: RegistrarComercioInput): Promise<RegistrarComercioOutput> {
    // 1. Verificar unicidad de RUC
    const existente = await this.deps.comercioRepository.findByRuc(input.ruc);
    if (existente) {
      throw new RucDuplicadoError(input.ruc);
    }

    // 2. Crear value objects (domain valida formato)
    const ruc = new RUC(input.ruc);
    const timbrado = new Timbrado(input.timbradoNumero, input.timbradoFechaInicio, input.timbradoFechaFin);

    // 3. Validar que el timbrado esté vigente
    timbrado.validarVigencia();

    // 4. Generar UUID
    const comercioId = randomUUID();

    // 5. Crear entidad Comercio (domain valida campos)
    const props: ComercioProps = {
      id: comercioId,
      ruc,
      razonSocial: input.razonSocial,
      nombreFantasia: input.nombreFantasia,
      timbrado,
      establecimiento: input.establecimiento,
      puntoExpedicion: input.puntoExpedicion,
      tipoContribuyente: input.tipoContribuyente,
      activo: true,
    };

    // Campos opcionales
    if (input.direccion) props.direccion = input.direccion;
    if (input.numeroCasa) props.numeroCasa = input.numeroCasa;
    if (input.departamento !== undefined) props.departamento = input.departamento;
    if (input.departamentoDesc) props.departamentoDesc = input.departamentoDesc;
    if (input.distrito !== undefined) props.distrito = input.distrito;
    if (input.distritoDesc) props.distritoDesc = input.distritoDesc;
    if (input.ciudad !== undefined) props.ciudad = input.ciudad;
    if (input.ciudadDesc) props.ciudadDesc = input.ciudadDesc;
    if (input.telefono) props.telefono = input.telefono;
    if (input.email) props.email = input.email;
    if (input.rubro) props.rubro = input.rubro;
    if (input.actividadEconomicaCodigo) props.actividadEconomicaCodigo = input.actividadEconomicaCodigo;
    if (input.actividadEconomicaDesc) props.actividadEconomicaDesc = input.actividadEconomicaDesc;
    if (input.tipoRegimen !== undefined) props.tipoRegimen = input.tipoRegimen;
    if (input.cscId) props.cscId = input.cscId;

    const comercio = new Comercio(props);

    // 6. Guardar
    await this.deps.comercioRepository.save(comercio);

    return { comercioId };
  }
}
