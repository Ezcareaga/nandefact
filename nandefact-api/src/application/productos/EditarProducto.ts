import type { TasaIVA } from '../../domain/shared/types.js';
import type { IProductoRepository } from '../../domain/producto/IProductoRepository.js';
import { ProductoNoEncontradoError } from '../errors/ProductoNoEncontradoError.js';

/** Input DTO para editar un producto */
export interface EditarProductoInput {
  productoId: string;
  cambios: {
    nombre?: string;
    codigo?: string;
    precioUnitario?: number;
    unidadMedida?: string;
    tasaIVA?: TasaIVA;
    categoria?: string;
    activo?: boolean;
  };
}

/** Caso de uso — Editar un producto existente o soft-delete */
export class EditarProducto {
  constructor(
    private readonly deps: {
      productoRepository: IProductoRepository;
    },
  ) {}

  async execute(input: EditarProductoInput): Promise<void> {
    // 1. Cargar producto
    const producto = await this.deps.productoRepository.findById(input.productoId);
    if (!producto) {
      throw new ProductoNoEncontradoError(input.productoId);
    }

    // 2. Aplicar cambios
    let productoActualizado;
    if (input.cambios.activo === false) {
      // Soft delete
      productoActualizado = producto.desactivar();
    } else {
      // Actualizar con cambios
      productoActualizado = producto.actualizar(input.cambios);
    }

    // 3. Guardar
    await this.deps.productoRepository.save(productoActualizado);
  }
}
