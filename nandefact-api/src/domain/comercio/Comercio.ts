import type { TipoContribuyente } from '../shared/types.js';
import type { RUC } from './RUC.js';
import type { Timbrado } from './Timbrado.js';
import { ComercioInvalidoError } from '../errors/ComercioInvalidoError.js';
import { DomainError } from '../errors/DomainError.js';

export interface ComercioProps {
  id: string;
  ruc: RUC;
  razonSocial: string;
  nombreFantasia: string;
  timbrado: Timbrado;
  establecimiento: string;
  puntoExpedicion: string;
  tipoContribuyente: TipoContribuyente;
  activo?: boolean | undefined;
  // Campos adicionales para XML SIFEN (Group B: Emisor)
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

/**
 * Entidad — Negocio del comerciante.
 * RUC, razón social, timbrado activo, establecimiento y punto de expedición.
 */
export class Comercio {
  readonly id: string;
  readonly ruc: RUC;
  readonly razonSocial: string;
  readonly nombreFantasia: string;
  readonly timbrado: Timbrado;
  readonly establecimiento: string;
  readonly puntoExpedicion: string;
  readonly tipoContribuyente: TipoContribuyente;
  readonly activo: boolean;
  // Campos adicionales SIFEN
  readonly direccion: string | null;
  readonly numeroCasa: string | null;
  readonly departamento: number | null;
  readonly departamentoDesc: string | null;
  readonly distrito: number | null;
  readonly distritoDesc: string | null;
  readonly ciudad: number | null;
  readonly ciudadDesc: string | null;
  readonly telefono: string | null;
  readonly email: string | null;
  readonly rubro: string | null;
  readonly actividadEconomicaCodigo: string | null;
  readonly actividadEconomicaDesc: string | null;
  readonly tipoRegimen: number | null;
  readonly cscId: string | null;

  constructor(props: ComercioProps) {
    if (props.razonSocial.trim().length === 0) {
      throw new ComercioInvalidoError('la razón social no puede estar vacía');
    }

    if (!/^\d{3}$/.test(props.establecimiento)) {
      throw new ComercioInvalidoError(`establecimiento "${props.establecimiento}" debe ser 3 dígitos`);
    }

    if (!/^\d{3}$/.test(props.puntoExpedicion)) {
      throw new ComercioInvalidoError(
        `punto de expedición "${props.puntoExpedicion}" debe ser 3 dígitos`,
      );
    }

    this.id = props.id;
    this.ruc = props.ruc;
    this.razonSocial = props.razonSocial.trim();
    this.nombreFantasia = props.nombreFantasia.trim();
    this.timbrado = props.timbrado;
    this.establecimiento = props.establecimiento;
    this.puntoExpedicion = props.puntoExpedicion;
    this.tipoContribuyente = props.tipoContribuyente;
    this.activo = props.activo ?? true;
    // Campos adicionales SIFEN (opcionales)
    this.direccion = props.direccion ?? null;
    this.numeroCasa = props.numeroCasa ?? null;
    this.departamento = props.departamento ?? null;
    this.departamentoDesc = props.departamentoDesc ?? null;
    this.distrito = props.distrito ?? null;
    this.distritoDesc = props.distritoDesc ?? null;
    this.ciudad = props.ciudad ?? null;
    this.ciudadDesc = props.ciudadDesc ?? null;
    this.telefono = props.telefono ?? null;
    this.email = props.email ?? null;
    this.rubro = props.rubro ?? null;
    this.actividadEconomicaCodigo = props.actividadEconomicaCodigo ?? null;
    this.actividadEconomicaDesc = props.actividadEconomicaDesc ?? null;
    this.tipoRegimen = props.tipoRegimen ?? null;
    this.cscId = props.cscId ?? null;
  }

  /**
   * Actualizar timbrado del comercio.
   * Patrón inmutable: retorna nuevo Comercio con timbrado actualizado.
   * Valida que el nuevo timbrado esté vigente al momento de la actualización.
   */
  actualizarTimbrado(nuevoTimbrado: Timbrado): Comercio {
    if (!nuevoTimbrado.estaVigente()) {
      throw new DomainError(`El timbrado ${nuevoTimbrado.numero} ya está vencido`);
    }

    const props = this.crearPropsBase({ timbrado: nuevoTimbrado });
    this.copiarCamposOpcionales(props);
    return new Comercio(props);
  }

  /**
   * Actualizar comercio con cambios parciales.
   * Patrón inmutable: retorna nuevo Comercio con cambios aplicados.
   * Los campos id, ruc, establecimiento, puntoExpedicion NO son actualizables.
   */
  actualizar(
    cambios: Partial<
      Omit<ComercioProps, 'id' | 'ruc' | 'establecimiento' | 'puntoExpedicion' | 'timbrado'>
    >,
  ): Comercio {
    const props: ComercioProps = {
      id: this.id,
      ruc: this.ruc,
      razonSocial: cambios.razonSocial ?? this.razonSocial,
      nombreFantasia: cambios.nombreFantasia ?? this.nombreFantasia,
      timbrado: this.timbrado, // timbrado se actualiza via actualizarTimbrado()
      establecimiento: this.establecimiento,
      puntoExpedicion: this.puntoExpedicion,
      tipoContribuyente: cambios.tipoContribuyente ?? this.tipoContribuyente,
      activo: cambios.activo ?? this.activo,
    };

    // Handle optional fields — merge cambios con valores actuales
    const camposOpcionales: (keyof ComercioProps)[] = [
      'direccion', 'numeroCasa', 'departamento', 'departamentoDesc',
      'distrito', 'distritoDesc', 'ciudad', 'ciudadDesc',
      'telefono', 'email', 'rubro', 'actividadEconomicaCodigo',
      'actividadEconomicaDesc', 'tipoRegimen', 'cscId',
    ];

    for (const campo of camposOpcionales) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const valorCambio = (cambios as any)[campo];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const valorActual = (this as any)[campo];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const valor = valorCambio !== undefined ? valorCambio : valorActual;
      if (valor !== null && valor !== undefined) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        (props as any)[campo] = valor;
      }
    }

    return new Comercio(props);
  }

  /**
   * Desactivar comercio (soft delete).
   * Patrón inmutable: retorna nuevo Comercio con activo=false.
   */
  desactivar(): Comercio {
    const props = this.crearPropsBase({ activo: false });
    this.copiarCamposOpcionales(props);
    return new Comercio(props);
  }

  // --- Helpers privados ---

  /** Crea props base con overrides opcionales */
  private crearPropsBase(overrides: Partial<ComercioProps> = {}): ComercioProps {
    return {
      id: this.id,
      ruc: this.ruc,
      razonSocial: this.razonSocial,
      nombreFantasia: this.nombreFantasia,
      timbrado: overrides.timbrado ?? this.timbrado,
      establecimiento: this.establecimiento,
      puntoExpedicion: this.puntoExpedicion,
      tipoContribuyente: this.tipoContribuyente,
      activo: overrides.activo ?? this.activo,
    };
  }

  /** Copia campos opcionales no-null de this a props */
  private copiarCamposOpcionales(props: ComercioProps): void {
    if (this.direccion !== null) props.direccion = this.direccion;
    if (this.numeroCasa !== null) props.numeroCasa = this.numeroCasa;
    if (this.departamento !== null) props.departamento = this.departamento;
    if (this.departamentoDesc !== null) props.departamentoDesc = this.departamentoDesc;
    if (this.distrito !== null) props.distrito = this.distrito;
    if (this.distritoDesc !== null) props.distritoDesc = this.distritoDesc;
    if (this.ciudad !== null) props.ciudad = this.ciudad;
    if (this.ciudadDesc !== null) props.ciudadDesc = this.ciudadDesc;
    if (this.telefono !== null) props.telefono = this.telefono;
    if (this.email !== null) props.email = this.email;
    if (this.rubro !== null) props.rubro = this.rubro;
    if (this.actividadEconomicaCodigo !== null)
      props.actividadEconomicaCodigo = this.actividadEconomicaCodigo;
    if (this.actividadEconomicaDesc !== null)
      props.actividadEconomicaDesc = this.actividadEconomicaDesc;
    if (this.tipoRegimen !== null) props.tipoRegimen = this.tipoRegimen;
    if (this.cscId !== null) props.cscId = this.cscId;
  }
}
