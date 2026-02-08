import type { TasaIVA } from '../shared/types.js';
import { ProductoInvalidoError } from '../errors/ProductoInvalidoError.js';

export interface ProductoProps {
  id: string;
  comercioId: string;
  nombre: string;
  codigo?: string;
  precioUnitario: number;
  unidadMedida: string;
  tasaIVA: TasaIVA;
  categoria?: string;
  activo?: boolean;
}

/**
 * Entidad — Producto del comercio.
 * Representa lo que vende el comerciante (mandioca, chipas, etc.).
 * Validaciones: nombre no vacío, precio > 0 y entero, unidadMedida no vacía, tasaIVA válida.
 */
export class Producto {
  readonly id: string;
  readonly comercioId: string;
  readonly nombre: string;
  readonly codigo: string | null;
  readonly precioUnitario: number;
  readonly unidadMedida: string;
  readonly tasaIVA: TasaIVA;
  readonly categoria: string | null;
  readonly activo: boolean;

  constructor(props: ProductoProps) {
    // Validar nombre
    if (props.nombre.trim().length === 0) {
      throw new ProductoInvalidoError('El nombre del producto no puede estar vacio');
    }

    // Validar precio unitario
    if (props.precioUnitario <= 0) {
      throw new ProductoInvalidoError('El precio unitario debe ser mayor a 0');
    }

    if (!Number.isInteger(props.precioUnitario)) {
      throw new ProductoInvalidoError('El precio unitario debe ser un entero (guaranies sin decimales)');
    }

    // Validar unidad de medida
    if (props.unidadMedida.trim().length === 0) {
      throw new ProductoInvalidoError('La unidad de medida no puede estar vacia');
    }

    // Validar tasa IVA
    if (![10, 5, 0].includes(props.tasaIVA)) {
      throw new ProductoInvalidoError('La tasa IVA debe ser 10, 5, o 0');
    }

    this.id = props.id;
    this.comercioId = props.comercioId;
    this.nombre = props.nombre.trim();
    this.codigo = props.codigo ?? null;
    this.precioUnitario = props.precioUnitario;
    this.unidadMedida = props.unidadMedida.trim();
    this.tasaIVA = props.tasaIVA;
    this.categoria = props.categoria ?? null;
    this.activo = props.activo ?? true;
  }

  /**
   * Desactivar producto (soft delete).
   * Patrón inmutable: retorna nuevo Producto con activo=false.
   */
  desactivar(): Producto {
    const props: ProductoProps = {
      id: this.id,
      comercioId: this.comercioId,
      nombre: this.nombre,
      precioUnitario: this.precioUnitario,
      unidadMedida: this.unidadMedida,
      tasaIVA: this.tasaIVA,
      activo: false,
    };
    if (this.codigo !== null) props.codigo = this.codigo;
    if (this.categoria !== null) props.categoria = this.categoria;
    return new Producto(props);
  }

  /**
   * Actualizar producto con cambios parciales.
   * Patrón inmutable: retorna nuevo Producto con cambios aplicados.
   * Re-valida todas las reglas de negocio.
   */
  actualizar(cambios: Partial<Omit<ProductoProps, 'id' | 'comercioId'>>): Producto {
    const props: ProductoProps = {
      id: this.id,
      comercioId: this.comercioId,
      nombre: cambios.nombre ?? this.nombre,
      precioUnitario: cambios.precioUnitario ?? this.precioUnitario,
      unidadMedida: cambios.unidadMedida ?? this.unidadMedida,
      tasaIVA: cambios.tasaIVA ?? this.tasaIVA,
      activo: cambios.activo ?? this.activo,
    };

    // Handle optional codigo
    const finalCodigo = cambios.codigo !== undefined ? cambios.codigo : this.codigo;
    if (finalCodigo !== null) props.codigo = finalCodigo;

    // Handle optional categoria
    const finalCategoria = cambios.categoria !== undefined ? cambios.categoria : this.categoria;
    if (finalCategoria !== null) props.categoria = finalCategoria;

    return new Producto(props);
  }
}
