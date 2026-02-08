import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;

/**
 * Obtiene una instancia singleton de PrismaClient para tests
 * Conecta a DATABASE_URL del environment
 */
export function getTestPrisma(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient();
  }
  return prismaInstance;
}

/**
 * Limpia todas las tablas de la base de datos
 * Respeta el orden de FKs: factura_detalle → factura → cliente → producto → usuario → comercio
 */
export async function cleanDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.facturaDetalle.deleteMany({});
  await prisma.factura.deleteMany({});
  await prisma.cliente.deleteMany({});
  await prisma.producto.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.comercio.deleteMany({});
}

/**
 * Desconecta el cliente Prisma
 * Llamar en afterAll de los tests
 */
export async function disconnectTestDb(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect();
}

// ============================================================================
// Test Factories
// ============================================================================

interface ComercioTestOverrides {
  ruc?: string;
  nombre?: string;
  razonSocial?: string;
  timbradoNumero?: string;
  timbradoFechaInicio?: Date;
  timbradoFechaFin?: Date;
}

/**
 * Crea un Comercio válido para tests
 */
export function crearComercioTest(
  overrides: ComercioTestOverrides = {}
): {
  ruc: string;
  nombre: string;
  razonSocial: string;
  nombreFantasia: string;
  establecimiento: string;
  puntoExpedicion: string;
  timbradoNumero: string;
  timbradoFechaInicio: Date;
  timbradoFechaFin: Date;
  direccion: string;
  numeroCasa: string;
  departamento: number;
  departamentoDes: string;
  distrito: number;
  distritoDes: string;
  ciudad: number;
  ciudadDes: string;
  telefono: string;
  email: string;
  rubro: string;
  actividadEconomicaCodigo: string;
  actividadEconomicaDes: string;
  tipoContribuyente: number;
  tipoRegimen: number;
  zonaMercado: string;
  activo: boolean;
} {
  const defaultFechaInicio = new Date('2025-01-01');
  const defaultFechaFin = new Date('2027-12-31');

  return {
    ruc: overrides.ruc ?? '80069563-1',
    nombre: overrides.nombre ?? 'Comercio Test',
    razonSocial: overrides.razonSocial ?? 'Comercio Test S.A.',
    nombreFantasia: 'Test Store',
    establecimiento: '001',
    puntoExpedicion: '001',
    timbradoNumero: overrides.timbradoNumero ?? '12345678',
    timbradoFechaInicio: overrides.timbradoFechaInicio ?? defaultFechaInicio,
    timbradoFechaFin: overrides.timbradoFechaFin ?? defaultFechaFin,
    direccion: 'Calle Test',
    numeroCasa: '123',
    departamento: 1,
    departamentoDes: 'Central',
    distrito: 1,
    distritoDes: 'Asunción',
    ciudad: 1,
    ciudadDes: 'Asunción',
    telefono: '+595981123456',
    email: 'test@comercio.com',
    rubro: 'Venta de alimentos',
    actividadEconomicaCodigo: '4711',
    actividadEconomicaDes: 'Venta al por menor en comercios no especializados',
    tipoContribuyente: 1,
    tipoRegimen: 1,
    zonaMercado: 'Mercado 4',
    activo: true,
  };
}

interface UsuarioTestOverrides {
  nombre?: string;
  telefono?: string;
  pinHash?: string;
  rol?: 'dueno' | 'empleado';
}

/**
 * Crea un Usuario válido para tests
 */
export function crearUsuarioTest(
  comercioId: string,
  overrides: UsuarioTestOverrides = {}
): {
  comercioId: string;
  nombre: string;
  telefono: string;
  pinHash: string;
  rol: 'dueno' | 'empleado';
  activo: boolean;
} {
  return {
    comercioId,
    nombre: overrides.nombre ?? 'Usuario Test',
    telefono: overrides.telefono ?? '+595981234567',
    pinHash: overrides.pinHash ?? '$2b$10$mockHashForTesting',
    rol: overrides.rol ?? 'dueno',
    activo: true,
  };
}

interface ProductoTestOverrides {
  nombre?: string;
  codigo?: string;
  precioUnitario?: bigint;
  unidadMedida?: string;
  ivaTipo?: '10%' | '5%' | 'exenta';
}

/**
 * Crea un Producto válido para tests
 */
export function crearProductoTest(
  comercioId: string,
  overrides: ProductoTestOverrides = {}
): {
  comercioId: string;
  nombre: string;
  codigo: string;
  precioUnitario: bigint;
  unidadMedida: string;
  ivaTipo: '10%' | '5%' | 'exenta';
  activo: boolean;
} {
  return {
    comercioId,
    nombre: overrides.nombre ?? 'Mandioca',
    codigo: overrides.codigo ?? 'MANDI-001',
    precioUnitario: overrides.precioUnitario ?? BigInt(5000),
    unidadMedida: overrides.unidadMedida ?? 'kg',
    ivaTipo: overrides.ivaTipo ?? '10%',
    activo: true,
  };
}

interface ClienteTestOverrides {
  nombre?: string;
  rucCi?: string;
  tipoDocumento?: 'RUC' | 'CI' | 'pasaporte' | 'innominado';
  telefono?: string;
  enviarWhatsapp?: boolean;
}

/**
 * Crea un Cliente válido para tests
 */
export function crearClienteTest(
  comercioId: string,
  overrides: ClienteTestOverrides = {}
): {
  comercioId: string;
  nombre: string;
  rucCi: string;
  tipoDocumento: 'RUC' | 'CI' | 'pasaporte' | 'innominado';
  telefono?: string;
  enviarWhatsapp: boolean;
} {
  return {
    comercioId,
    nombre: overrides.nombre ?? 'Cliente Test',
    rucCi: overrides.rucCi ?? '12345678',
    tipoDocumento: overrides.tipoDocumento ?? 'CI',
    telefono: overrides.telefono,
    enviarWhatsapp: overrides.enviarWhatsapp ?? true,
  };
}
