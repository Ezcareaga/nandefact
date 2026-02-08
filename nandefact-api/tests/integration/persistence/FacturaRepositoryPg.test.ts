import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { FacturaRepositoryPg } from '../../../src/infrastructure/persistence/FacturaRepositoryPg.js';
import { Factura } from '../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../src/domain/factura/NumeroFactura.js';
import { Comercio } from '../../../src/domain/comercio/Comercio.js';
import { Cliente } from '../../../src/domain/cliente/Cliente.js';
import { RUC } from '../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../src/domain/comercio/Timbrado.js';
import { ComercioRepositoryPg } from '../../../src/infrastructure/persistence/ComercioRepositoryPg.js';
import { ClienteRepositoryPg } from '../../../src/infrastructure/persistence/ClienteRepositoryPg.js';
import {
  getTestPrisma,
  cleanDatabase,
  disconnectTestDb,
} from '../helpers/testDb.js';

describe('FacturaRepositoryPg - Integration Tests', () => {
  const prisma = getTestPrisma();
  const repository = new FacturaRepositoryPg(prisma);
  const comercioRepository = new ComercioRepositoryPg(prisma);
  const clienteRepository = new ClienteRepositoryPg(prisma);

  let comercioId: string;
  let clienteId: string;
  let timbrado: Timbrado;

  beforeAll(async () => {
    // Crear comercio y cliente de prueba
    const comercio = new Comercio({
      id: 'comercio-factura-test',
      ruc: new RUC('80069563-1'),
      razonSocial: 'Comercio Factura',
      nombreFantasia: 'Factura Test',
      timbrado: new Timbrado('12345678', new Date('2025-01-01'), new Date('2027-12-31')),
      establecimiento: '001',
      puntoExpedicion: '001',
      tipoContribuyente: 1,
    });
    await comercioRepository.save(comercio);
    comercioId = comercio.id;
    timbrado = comercio.timbrado;

    const cliente = new Cliente({
      id: 'cliente-factura-test',
      comercioId,
      nombre: 'Cliente Test',
      rucCi: '12345678',
      tipoDocumento: 'CI',
    });
    await clienteRepository.save(cliente);
    clienteId = cliente.id;
  });

  beforeEach(async () => {
    // Limpiar solo facturas y detalles
    await prisma.facturaDetalle.deleteMany({});
    await prisma.factura.deleteMany({});
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await disconnectTestDb(prisma);
  });

  describe('save - crear factura', () => {
    it('debería crear factura con items', async () => {
      // Arrange
      const items = [
        new ItemFactura({
          descripcion: 'Mandioca',
          cantidad: 3,
          precioUnitario: 5000,
          tasaIVA: 10,
        }),
      ];

      const numeroFactura = new NumeroFactura('001', '001', '0000001');
      const factura = new Factura({
        id: 'factura-001',
        comercioId,
        clienteId,
        tipoDocumento: 1,
        timbrado,
        numeroFactura,
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2026-02-08'),
      });

      factura.agregarItem(items[0]);

      // Act
      await repository.save(factura);

      // Assert
      const found = await repository.findById('factura-001');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('factura-001');
      expect(found?.items).toHaveLength(1);
      expect(found?.items[0].descripcion).toBe('Mandioca');
    });

    it('debería persistir BigInt correctamente (montos en PYG)', async () => {
      // Arrange
      const items = [
        new ItemFactura({
          descripcion: 'Producto Grande',
          cantidad: 100,
          precioUnitario: 1500000, // 1.5 millones de guaraníes
          tasaIVA: 10,
        }),
      ];

      const numeroFactura = new NumeroFactura('001', '001', '0000002');
      const factura = new Factura({
        id: 'factura-002',
        comercioId,
        clienteId,
        tipoDocumento: 1,
        timbrado,
        numeroFactura,
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2026-02-08'),
      });

      factura.agregarItem(items[0]);

      // Act
      await repository.save(factura);

      // Assert
      const found = await repository.findById('factura-002');
      expect(found?.totalBruto).toBe(150000000); // 150 millones
      expect(found?.items[0].precioUnitario).toBe(1500000);
      expect(found?.items[0].cantidad).toBe(100);
    });

    it('debería guardar factura con múltiples items con IVA diferente', async () => {
      // Arrange
      const items = [
        new ItemFactura({ descripcion: 'Producto 10%', cantidad: 2, precioUnitario: 11000, tasaIVA: 10 }),
        new ItemFactura({ descripcion: 'Producto 5%', cantidad: 1, precioUnitario: 10500, tasaIVA: 5 }),
        new ItemFactura({ descripcion: 'Producto Exento', cantidad: 1, precioUnitario: 5000, tasaIVA: 0 }),
      ];

      const numeroFactura = new NumeroFactura('001', '001', '0000003');
      const factura = new Factura({
        id: 'factura-003',
        comercioId,
        clienteId,
        tipoDocumento: 1,
        timbrado,
        numeroFactura,
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2026-02-08'),
      });

      for (const item of items) {
        factura.agregarItem(item);
      }

      // Act
      await repository.save(factura);

      // Assert
      const found = await repository.findById('factura-003');
      expect(found?.items).toHaveLength(3);
      expect(found?.totalIVA10).toBeGreaterThan(0);
      expect(found?.totalIVA5).toBeGreaterThan(0);
      expect(found?.totalExenta).toBe(5000);
    });

    it('debería mapear CDC value object correctamente', async () => {
      // Arrange
      const numeroFactura = new NumeroFactura('001', '001', '0000004');
      const factura = new Factura({
        id: 'factura-004',
        comercioId,
        clienteId,
        tipoDocumento: 1,
        timbrado,
        numeroFactura,
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2026-02-08'),
      });

      const item = new ItemFactura({ descripcion: 'Test CDC', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 });
      factura.agregarItem(item);

      // Generar CDC
      const cdcValue = '01800695631001001000000112026020811234567890';
      factura.generarCDC(cdcValue);

      // Act
      await repository.save(factura);

      // Assert
      const found = await repository.findById('factura-004');
      expect(found?.cdc).not.toBeNull();
      expect(found?.cdc?.value).toBe(cdcValue);
    });

    it('debería mapear NumeroFactura value object correctamente', async () => {
      // Arrange
      const numeroFactura = new NumeroFactura('002', '003', '0000123');
      const factura = new Factura({
        id: 'factura-005',
        comercioId,
        clienteId,
        tipoDocumento: 1,
        timbrado,
        numeroFactura,
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2026-02-08'),
      });

      const item = new ItemFactura({ descripcion: 'Test Numero', cantidad: 1, precioUnitario: 5000, tasaIVA: 10 });
      factura.agregarItem(item);

      // Act
      await repository.save(factura);

      // Assert
      const found = await repository.findById('factura-005');
      expect(found?.numeroFactura.establecimiento).toBe('002');
      expect(found?.numeroFactura.punto).toBe('003');
      expect(found?.numeroFactura.numero).toBe('0000123');
    });

    it('debería persistir snapshot del Timbrado', async () => {
      // Arrange
      const timbradoEspecial = new Timbrado('99999999', new Date('2026-01-01'), new Date('2028-12-31'));
      const numeroFactura = new NumeroFactura('001', '001', '0000006');
      const factura = new Factura({
        id: 'factura-006',
        comercioId,
        clienteId,
        tipoDocumento: 1,
        timbrado: timbradoEspecial,
        numeroFactura,
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2026-02-08'),
      });

      const item = new ItemFactura({ descripcion: 'Test Timbrado', cantidad: 1, precioUnitario: 5000, tasaIVA: 10 });
      factura.agregarItem(item);

      // Act
      await repository.save(factura);

      // Assert
      const found = await repository.findById('factura-006');
      expect(found?.timbrado.numero).toBe('99999999');
      expect(found?.timbrado.fechaInicio.toISOString()).toContain('2026-01-01');
    });
  });

  describe('save - actualizar factura', () => {
    it('debería actualizar estado de factura', async () => {
      // Arrange - crear primero
      const numeroFactura = new NumeroFactura('001', '001', '0000007');
      const factura = new Factura({
        id: 'factura-007',
        comercioId,
        clienteId,
        tipoDocumento: 1,
        timbrado,
        numeroFactura,
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2026-02-08'),
      });

      const item = new ItemFactura({ descripcion: 'Test Update', cantidad: 1, precioUnitario: 5000, tasaIVA: 10 });
      factura.agregarItem(item);
      await repository.save(factura);

      // Act - actualizar estado
      factura.marcarComoEnviado();
      await repository.save(factura);

      // Assert
      const found = await repository.findById('factura-007');
      expect(found?.estado).toBe('enviado');
    });
  });

  describe('findById', () => {
    it('debería retornar null si no existe', async () => {
      // Act
      const found = await repository.findById('no-existe');

      // Assert
      expect(found).toBeNull();
    });

    it('debería reconstruir factura completa con todos sus items', async () => {
      // Arrange
      const numeroFactura = new NumeroFactura('001', '001', '0000008');
      const factura = new Factura({
        id: 'factura-008',
        comercioId,
        clienteId,
        tipoDocumento: 1,
        timbrado,
        numeroFactura,
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2026-02-08'),
      });

      const items = [
        new ItemFactura({ descripcion: 'Item 1', cantidad: 2, precioUnitario: 5000, tasaIVA: 10 }),
        new ItemFactura({ descripcion: 'Item 2', cantidad: 1, precioUnitario: 10000, tasaIVA: 5 }),
      ];

      for (const item of items) {
        factura.agregarItem(item);
      }

      await repository.save(factura);

      // Act
      const found = await repository.findById('factura-008');

      // Assert
      expect(found?.items).toHaveLength(2);
      expect(found?.items[0].descripcion).toBe('Item 1');
      expect(found?.items[1].descripcion).toBe('Item 2');
      expect(found?.totalBruto).toBe(20000);
    });
  });

  describe('findByComercio', () => {
    it('debería retornar facturas del comercio ordenadas por fecha desc', async () => {
      // Arrange - crear 3 facturas
      for (let i = 1; i <= 3; i++) {
        const numeroFactura = new NumeroFactura('001', '001', `000000${i}`);
        const factura = new Factura({
          id: `factura-comercio-${i}`,
          comercioId,
          clienteId,
          tipoDocumento: 1,
          timbrado,
          numeroFactura,
          tipoEmision: 1,
          condicionPago: 'contado',
          fechaEmision: new Date(`2026-02-0${i}`),
        });

        const item = new ItemFactura({ descripcion: `Item ${i}`, cantidad: 1, precioUnitario: 5000, tasaIVA: 10 });
        factura.agregarItem(item);
        await repository.save(factura);
      }

      // Act
      const facturas = await repository.findByComercio(comercioId);

      // Assert
      expect(facturas).toHaveLength(3);
      // Ordenadas por createdAt desc (la más reciente primero)
      expect(facturas[0].id).toBe('factura-comercio-3');
    });
  });

  describe('findPendientes', () => {
    it('debería retornar solo facturas pendientes ordenadas por fecha asc', async () => {
      // Arrange - crear facturas con diferentes estados
      const estados: Array<'pendiente' | 'enviado' | 'aprobado'> = ['pendiente', 'enviado', 'pendiente'];

      for (let i = 1; i <= 3; i++) {
        const numeroFactura = new NumeroFactura('001', '001', `000001${i}`);
        const factura = new Factura({
          id: `factura-pend-${i}`,
          comercioId,
          clienteId,
          tipoDocumento: 1,
          timbrado,
          numeroFactura,
          tipoEmision: 1,
          condicionPago: 'contado',
          fechaEmision: new Date('2026-02-08'),
        });

        const item = new ItemFactura({ descripcion: `Item ${i}`, cantidad: 1, precioUnitario: 5000, tasaIVA: 10 });
        factura.agregarItem(item);

        // Cambiar estado según array
        if (estados[i - 1] === 'enviado') {
          factura.marcarComoEnviado();
        } else if (estados[i - 1] === 'aprobado') {
          factura.marcarComoEnviado();
          factura.aprobar('0260', 'Aprobado');
        }

        await repository.save(factura);
      }

      // Act
      const pendientes = await repository.findPendientes(comercioId);

      // Assert
      expect(pendientes).toHaveLength(2);
      expect(pendientes.every(f => f.estado === 'pendiente')).toBe(true);
    });
  });
});
