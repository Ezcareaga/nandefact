import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ComercioRepositoryPg } from '../../../src/infrastructure/persistence/ComercioRepositoryPg.js';
import { Comercio } from '../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../src/domain/comercio/Timbrado.js';
import {
  getTestPrisma,
  cleanDatabase,
  disconnectTestDb,
  crearComercioTest,
} from '../helpers/testDb.js';
import type { TipoContribuyente } from '../../../src/domain/shared/types.js';

describe('ComercioRepositoryPg - Integration Tests', () => {
  const prisma = getTestPrisma();
  const repository = new ComercioRepositoryPg(prisma);

  beforeAll(() => {
    // Prisma ya está conectado por getTestPrisma()
  });

  beforeEach(async () => {
    await cleanDatabase(prisma);
  });

  afterAll(async () => {
    await disconnectTestDb(prisma);
  });

  describe('save - crear comercio', () => {
    it('debería crear un comercio con todos los campos', async () => {
      // Arrange
      const props = crearComercioTest();
      const comercio = new Comercio({
        id: 'comercio-001',
        ruc: new RUC(props.ruc),
        razonSocial: props.razonSocial,
        nombreFantasia: props.nombreFantasia,
        timbrado: new Timbrado(props.timbradoNumero, props.timbradoFechaInicio, props.timbradoFechaFin),
        establecimiento: props.establecimiento,
        puntoExpedicion: props.puntoExpedicion,
        tipoContribuyente: props.tipoContribuyente as TipoContribuyente,
        activo: true,
        direccion: props.direccion,
        numeroCasa: props.numeroCasa,
        departamento: props.departamento,
        departamentoDesc: props.departamentoDesc,
        distrito: props.distrito,
        distritoDesc: props.distritoDes,
        ciudad: props.ciudad,
        ciudadDesc: props.ciudadDes,
        telefono: props.telefono,
        email: props.email,
        rubro: props.rubro,
        actividadEconomicaCodigo: props.actividadEconomicaCodigo,
        actividadEconomicaDesc: props.actividadEconomicaDes,
        tipoRegimen: props.tipoRegimen,
      });

      // Act
      await repository.save(comercio);

      // Assert
      const found = await repository.findById('comercio-001');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('comercio-001');
      expect(found?.ruc.value).toBe('80069563-1');
      expect(found?.razonSocial).toBe('Comercio Test S.A.');
      expect(found?.timbrado.numero).toBe('12345678');
      expect(found?.activo).toBe(true);
    });

    it('debería crear comercio con campos opcionales nulos', async () => {
      // Arrange
      const comercio = new Comercio({
        id: 'comercio-002',
        ruc: new RUC('80069563-1'),
        razonSocial: 'Comercio Mínimo',
        nombreFantasia: 'Mínimo',
        timbrado: new Timbrado('12345678', new Date('2025-01-01'), new Date('2027-12-31')),
        establecimiento: '001',
        puntoExpedicion: '001',
        tipoContribuyente: 1,
        activo: true,
      });

      // Act
      await repository.save(comercio);

      // Assert
      const found = await repository.findById('comercio-002');
      expect(found).not.toBeNull();
      expect(found?.direccion).toBeNull();
      expect(found?.email).toBeNull();
      expect(found?.rubro).toBeNull();
    });
  });

  describe('save - actualizar comercio', () => {
    it('debería actualizar comercio existente', async () => {
      // Arrange - crear primero
      const comercio = new Comercio({
        id: 'comercio-003',
        ruc: new RUC('80069563-1'),
        razonSocial: 'Original',
        nombreFantasia: 'Original',
        timbrado: new Timbrado('12345678', new Date('2025-01-01'), new Date('2027-12-31')),
        establecimiento: '001',
        puntoExpedicion: '001',
        tipoContribuyente: 1,
      });
      await repository.save(comercio);

      // Act - actualizar
      const actualizado = comercio.actualizar({
        razonSocial: 'Actualizado S.A.',
        nombreFantasia: 'Actualizado Store',
        email: 'nuevo@email.com',
      });
      await repository.save(actualizado);

      // Assert
      const found = await repository.findById('comercio-003');
      expect(found?.razonSocial).toBe('Actualizado S.A.');
      expect(found?.nombreFantasia).toBe('Actualizado Store');
      expect(found?.email).toBe('nuevo@email.com');
    });
  });

  describe('findById', () => {
    it('debería retornar null si no existe', async () => {
      // Act
      const found = await repository.findById('no-existe');

      // Assert
      expect(found).toBeNull();
    });

    it('debería reconstruir value objects correctamente', async () => {
      // Arrange
      const comercio = new Comercio({
        id: 'comercio-004',
        ruc: new RUC('80069563-1'),
        razonSocial: 'Test VO',
        nombreFantasia: 'Test',
        timbrado: new Timbrado('87654321', new Date('2025-02-01'), new Date('2026-12-31')),
        establecimiento: '002',
        puntoExpedicion: '003',
        tipoContribuyente: 2,
      });
      await repository.save(comercio);

      // Act
      const found = await repository.findById('comercio-004');

      // Assert - verificar que RUC y Timbrado son instancias correctas
      expect(found).not.toBeNull();
      expect(found?.ruc).toBeInstanceOf(RUC);
      expect(found?.ruc.value).toBe('80069563-1');
      expect(found?.timbrado).toBeInstanceOf(Timbrado);
      expect(found?.timbrado.numero).toBe('87654321');
      expect(found?.timbrado.fechaInicio.toISOString()).toContain('2025-02-01');
    });
  });

  describe('findByRuc', () => {
    it('debería encontrar comercio por RUC', async () => {
      // Arrange
      const comercio = new Comercio({
        id: 'comercio-005',
        ruc: new RUC('12345678-9'),
        razonSocial: 'Buscar por RUC',
        nombreFantasia: 'RUC Test',
        timbrado: new Timbrado('11111111', new Date('2025-01-01'), new Date('2027-12-31')),
        establecimiento: '001',
        puntoExpedicion: '001',
        tipoContribuyente: 1,
      });
      await repository.save(comercio);

      // Act
      const found = await repository.findByRuc('12345678-9');

      // Assert
      expect(found).not.toBeNull();
      expect(found?.id).toBe('comercio-005');
      expect(found?.ruc.value).toBe('12345678-9');
    });

    it('debería retornar null si RUC no existe', async () => {
      // Act
      const found = await repository.findByRuc('99999999-9');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('mapeo de campos SIFEN', () => {
    it('debería mapear correctamente todos los campos opcionales', async () => {
      // Arrange
      const props = crearComercioTest({
        ruc: '80069563-1',
      });

      const comercio = new Comercio({
        id: 'comercio-006',
        ruc: new RUC(props.ruc),
        razonSocial: props.razonSocial,
        nombreFantasia: props.nombreFantasia,
        timbrado: new Timbrado(props.timbradoNumero, props.timbradoFechaInicio, props.timbradoFechaFin),
        establecimiento: props.establecimiento,
        puntoExpedicion: props.puntoExpedicion,
        tipoContribuyente: props.tipoContribuyente as TipoContribuyente,
        direccion: 'Calle Test 123',
        numeroCasa: '456',
        departamento: 1,
        departamentoDesc: 'Central',
        distrito: 1,
        distritoDesc: 'Asunción',
        ciudad: 1,
        ciudadDesc: 'Asunción',
        telefono: '+595981123456',
        email: 'test@comercio.com',
        rubro: 'Venta de alimentos',
        actividadEconomicaCodigo: '4711',
        actividadEconomicaDesc: 'Venta al por menor',
        tipoRegimen: 1,
        cscId: 'CSC001',
      });

      // Act
      await repository.save(comercio);
      const found = await repository.findById('comercio-006');

      // Assert
      expect(found?.direccion).toBe('Calle Test 123');
      expect(found?.numeroCasa).toBe('456');
      expect(found?.departamento).toBe(1);
      expect(found?.departamentoDesc).toBe('Central');
      expect(found?.distrito).toBe(1);
      expect(found?.distritoDesc).toBe('Asunción');
      expect(found?.ciudad).toBe(1);
      expect(found?.ciudadDesc).toBe('Asunción');
      expect(found?.telefono).toBe('+595981123456');
      expect(found?.email).toBe('test@comercio.com');
      expect(found?.rubro).toBe('Venta de alimentos');
      expect(found?.actividadEconomicaCodigo).toBe('4711');
      expect(found?.actividadEconomicaDesc).toBe('Venta al por menor');
      expect(found?.tipoRegimen).toBe(1);
      expect(found?.cscId).toBe('CSC001');
    });
  });
});
