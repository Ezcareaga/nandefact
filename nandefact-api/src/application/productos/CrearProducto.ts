import { randomUUID } from 'node:crypto';
import type { TasaIVA } from '../../domain/shared/types.js';
import type { IProductoRepository } from '../../domain/producto/IProductoRepository.js';
import type { IComercioRepository } from '../../domain/comercio/IComercioRepository.js';
import { Producto, type ProductoProps } from '../../domain/producto/Producto.js';
import { ComercioNoEncontradoError } from '../errors/ComercioNoEncontradoError.js';

/** Input DTO para crear un producto */
export interface CrearProductoInput {
  comercioId: string;
  nombre: string;
  codigo?: string;
  precioUnitario: number;
  unidadMedida: string;
  tasaIVA: TasaIVA;
  categoria?: string;
}

/** Output DTO después de crear un producto */
export interface CrearProductoOutput {
  productoId: string;
}

/** Caso de uso — Crear un nuevo producto */
export class CrearProducto {
  constructor(
    private readonly deps: {
      productoRepository: IProductoRepository;
      comercioRepository: IComercioRepository;
    },
  ) {}

  async execute(input: CrearProductoInput): Promise<CrearProductoOutput> {
    // 1. Validar que el comercio existe
    const comercio = await this.deps.comercioRepository.findById(input.comercioId);
    if (!comercio) {
      throw new ComercioNoEncontradoError(input.comercioId);
    }

    // 2. Generar UUID para el producto
    const productoId = randomUUID();

    // 3. Crear instancia de Producto (domain valida)
    const props: ProductoProps = {
      id: productoId,
      comercioId: input.comercioId,
      nombre: input.nombre,
      precioUnitario: input.precioUnitario,
      unidadMedida: input.unidadMedida,
      tasaIVA: input.tasaIVA,
      activo: true,
    };
    if (input.codigo) props.codigo = input.codigo;
    if (input.categoria) props.categoria = input.categoria;

    const producto = new Producto(props);

    // 4. Guardar en el repositorio
    await this.deps.productoRepository.save(producto);

    // 5. Retornar output
    return {
      productoId: producto.id,
    };
  }
}
