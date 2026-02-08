import type { Producto } from './Producto.js';

/**
 * Puerto (interfaz) del repositorio de productos.
 * La capa de dominio define qué necesita, la capa de infraestructura implementa cómo.
 * Arquitectura Hexagonal — este es un puerto del dominio.
 */
export interface IProductoRepository {
  /** Guardar producto (crear o actualizar). */
  save(producto: Producto): Promise<void>;

  /** Buscar producto por ID. Retorna null si no existe. */
  findById(id: string): Promise<Producto | null>;

  /**
   * Buscar todos los productos de un comercio con paginación.
   * @param comercioId - ID del comercio
   * @param options - Opciones de paginación y filtrado
   * @param options.page - Número de página (1-indexed)
   * @param options.pageSize - Cantidad de productos por página
   * @param options.soloActivos - Si true, solo retorna productos activos
   * @returns Lista paginada de productos con total
   */
  findByComercio(
    comercioId: string,
    options?: {
      page?: number;
      pageSize?: number;
      soloActivos?: boolean;
    }
  ): Promise<{ productos: Producto[]; total: number }>;
}
