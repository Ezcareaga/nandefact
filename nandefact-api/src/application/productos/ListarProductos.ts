import type { TasaIVA } from '../../domain/shared/types.js';
import type { IProductoRepository } from '../../domain/producto/IProductoRepository.js';

/** Input DTO para listar productos */
export interface ListarProductosInput {
  comercioId: string;
  page?: number;
  pageSize?: number;
  soloActivos?: boolean;
}

/** Output DTO con lista paginada de productos */
export interface ListarProductosOutput {
  productos: Array<{
    id: string;
    nombre: string;
    codigo: string | null;
    precioUnitario: number;
    unidadMedida: string;
    tasaIVA: TasaIVA;
    categoria: string | null;
    activo: boolean;
  }>;
  total: number;
  page: number;
  pageSize: number;
}

/** Caso de uso — Listar productos de un comercio con paginación */
export class ListarProductos {
  constructor(
    private readonly deps: {
      productoRepository: IProductoRepository;
    },
  ) {}

  async execute(input: ListarProductosInput): Promise<ListarProductosOutput> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;
    const soloActivos = input.soloActivos ?? true;

    // 1. Obtener productos del repositorio
    const { productos, total } = await this.deps.productoRepository.findByComercio(
      input.comercioId,
      { page, pageSize, soloActivos },
    );

    // 2. Mapear a DTOs
    const productosDTO = productos.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      codigo: p.codigo,
      precioUnitario: p.precioUnitario,
      unidadMedida: p.unidadMedida,
      tasaIVA: p.tasaIVA,
      categoria: p.categoria,
      activo: p.activo,
    }));

    // 3. Retornar output paginado
    return {
      productos: productosDTO,
      total,
      page,
      pageSize,
    };
  }
}
