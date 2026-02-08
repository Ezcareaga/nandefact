import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ClienteRepositoryPg } from '../../../src/infrastructure/persistence/ClienteRepositoryPg.js';
import { Cliente } from '../../../src/domain/cliente/Cliente.js';
import { Comercio } from '../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../src/domain/comercio/Timbrado.js';
import { ComercioRepositoryPg } from '../../../src/infrastructure/persistence/ComercioRepositoryPg.js';
import {
  getTestPrisma,
  cleanDatabase,
  disconnectTestDb,
  crearClienteTest,
} from '../helpers/testDb.js';

describe('ClienteRepositoryPg - Integration Tests', () => {
  const prisma = getTestPrisma();
  const repository = new ClienteRepositoryPg(prisma);
  const comercioRepository = new ComercioRepositoryPg(prisma);

  let comercioId: string;
  let comercio2Id: string;

  beforeAll(async () => {
    // Crear dos comercios de prueba
    const comercio1 = new Comercio({
      id: 'comercio-cliente-test-1',
      ruc: new RUC('80069563-1'),
      razonSocial: 'Comercio 1',
      nombreFantasia: 'Comercio 1',
      timbrado: new Timbrado('12345678', new Date('2025-01-01'), new Date('2027-12-31')),
      establecimiento: '001',
      puntoExpedicion: '001',
      tipoContribuyente: 1,
    });

    const comercio2 = new Comercio({
      id: 'comercio-cliente-test-2',
      ruc: new RUC('12345678-9'),
      razonSocial: 'Comercio 2',
      nombreFantasia: 'Comercio 2',
      timbrado: new Timbrado('87654321', new Date('2025-01-01'), new Date('2027-12-31')),
      establecimiento: '001',
      puntoExpedicion: '001',
      tipoContribuyente: 1,
    });

    await comercioRepository.save(comercio1);
    await comercioRepository.save(comercio2);
    comercioId = comercio1.id;
    comercio2Id = comercio2.id;
  });

  beforeEach(async () => {
    // Limpiar solo clientes (mantener comercios)
    await prisma.cliente.deleteMany({});
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await disconnectTestDb(prisma);
  });

  describe('save - crear cliente', () => {
    it('debería crear cliente con todos los campos', async () => {
      // Arrange
      const cliente = new Cliente({
        id: 'cliente-001',
        comercioId,
        nombre: 'Juan Pérez',
        rucCi: '12345678',
        tipoDocumento: 'CI',
        telefono: '+595981234567',
        email: 'juan@email.com',
        direccion: 'Calle Test 123',
        frecuente: true,
        enviarWhatsApp: true,
      });

      // Act
      await repository.save(cliente);

      // Assert
      const found = await repository.findById('cliente-001');
      expect(found).not.toBeNull();
      expect(found?.nombre).toBe('Juan Pérez');
      expect(found?.rucCi).toBe('12345678');
      expect(found?.tipoDocumento).toBe('CI');
      expect(found?.telefono).toBe('+595981234567');
      expect(found?.frecuente).toBe(true);
      expect(found?.enviarWhatsApp).toBe(true);
    });

    it('debería crear cliente con campos opcionales undefined', async () => {
      // Arrange
      const cliente = new Cliente({
        id: 'cliente-002',
        comercioId,
        nombre: 'María González',
        rucCi: '87654321',
        tipoDocumento: 'CI',
      });

      // Act
      await repository.save(cliente);

      // Assert
      const found = await repository.findById('cliente-002');
      expect(found?.telefono).toBeUndefined();
      expect(found?.email).toBeUndefined();
      expect(found?.direccion).toBeUndefined();
      expect(found?.frecuente).toBe(false); // Default
      expect(found?.enviarWhatsApp).toBe(true); // Default
    });

    it('debería crear cliente tipo RUC', async () => {
      // Arrange
      const cliente = new Cliente({
        id: 'cliente-003',
        comercioId,
        nombre: 'Empresa S.A.',
        rucCi: '80012345-6',
        tipoDocumento: 'RUC',
      });

      // Act
      await repository.save(cliente);

      // Assert
      const found = await repository.findById('cliente-003');
      expect(found?.tipoDocumento).toBe('RUC');
    });

    it('debería crear cliente innominado', async () => {
      // Arrange
      const cliente = new Cliente({
        id: 'cliente-004',
        comercioId,
        nombre: 'Cliente sin identificar',
        rucCi: '0',
        tipoDocumento: 'innominado',
      });

      // Act
      await repository.save(cliente);

      // Assert
      const found = await repository.findById('cliente-004');
      expect(found?.tipoDocumento).toBe('innominado');
      expect(found?.rucCi).toBe('0');
    });
  });

  describe('save - actualizar cliente', () => {
    it('debería actualizar cliente existente', async () => {
      // Arrange - crear primero
      const cliente = new Cliente({
        id: 'cliente-005',
        comercioId,
        nombre: 'Original',
        rucCi: '11111111',
        tipoDocumento: 'CI',
      });
      await repository.save(cliente);

      // Act - actualizar
      const actualizado = cliente.actualizar({
        nombre: 'Nombre Actualizado',
        telefono: '+595987654321',
        frecuente: true,
      });
      await repository.save(actualizado);

      // Assert
      const found = await repository.findById('cliente-005');
      expect(found?.nombre).toBe('Nombre Actualizado');
      expect(found?.telefono).toBe('+595987654321');
      expect(found?.frecuente).toBe(true);
    });
  });

  describe('findById', () => {
    it('debería retornar null si no existe', async () => {
      // Act
      const found = await repository.findById('no-existe');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('findByComercio', () => {
    beforeEach(async () => {
      // Crear clientes para dos comercios
      const clientes = [
        new Cliente({ id: 'cli-1', comercioId, nombre: 'Ana', rucCi: '1', tipoDocumento: 'CI' }),
        new Cliente({ id: 'cli-2', comercioId, nombre: 'Bernardo', rucCi: '2', tipoDocumento: 'CI' }),
        new Cliente({ id: 'cli-3', comercio2Id, nombre: 'Carlos', rucCi: '3', tipoDocumento: 'CI' }),
        new Cliente({ id: 'cli-4', comercioId, nombre: 'Diana', rucCi: '4', tipoDocumento: 'CI' }),
      ];

      for (const c of clientes) {
        await repository.save(c);
      }
    });

    it('debería retornar solo clientes del comercio especificado', async () => {
      // Act
      const clientes = await repository.findByComercio(comercioId);

      // Assert
      expect(clientes).toHaveLength(3);
      expect(clientes.every(c => c.comercioId === comercioId)).toBe(true);
    });

    it('debería ordenar por nombre ascendente', async () => {
      // Act
      const clientes = await repository.findByComercio(comercioId);

      // Assert
      expect(clientes[0].nombre).toBe('Ana');
      expect(clientes[1].nombre).toBe('Bernardo');
      expect(clientes[2].nombre).toBe('Diana');
    });
  });

  describe('buscar', () => {
    beforeEach(async () => {
      // Crear clientes variados
      const clientes = [
        new Cliente({ id: 'cli-10', comercioId, nombre: 'Juan Pérez', rucCi: '12345678', tipoDocumento: 'CI', frecuente: true }),
        new Cliente({ id: 'cli-11', comercioId, nombre: 'María González', rucCi: '87654321', tipoDocumento: 'CI', frecuente: false }),
        new Cliente({ id: 'cli-12', comercioId, nombre: 'Pedro Martínez', rucCi: '11111111', tipoDocumento: 'CI', frecuente: false }),
        new Cliente({ id: 'cli-13', comercio2Id, nombre: 'Juan Rodríguez', rucCi: '22222222', tipoDocumento: 'CI' }),
      ];

      for (const c of clientes) {
        await repository.save(c);
      }
    });

    it('debería buscar por nombre', async () => {
      // Act
      const resultado = await repository.buscar(comercioId, 'Juan');

      // Assert
      expect(resultado).toHaveLength(1);
      expect(resultado[0].nombre).toBe('Juan Pérez');
    });

    it('debería buscar por RUC/CI', async () => {
      // Act
      const resultado = await repository.buscar(comercioId, '8765');

      // Assert
      expect(resultado).toHaveLength(1);
      expect(resultado[0].rucCi).toBe('87654321');
    });

    it('debería retornar vacío si no hay coincidencias', async () => {
      // Act
      const resultado = await repository.buscar(comercioId, 'NoExiste');

      // Assert
      expect(resultado).toHaveLength(0);
    });

    it('debería buscar solo en el comercio especificado', async () => {
      // Act
      const resultado = await repository.buscar(comercioId, 'Juan');

      // Assert
      expect(resultado).toHaveLength(1);
      expect(resultado[0].id).toBe('cli-10'); // NO cli-13 que es del comercio2
    });

    it('debería ordenar frecuentes primero', async () => {
      // Act - buscar término que coincida con múltiples
      const resultado = await repository.buscar(comercioId, 'e'); // Coincide con todos

      // Assert - Juan Pérez (frecuente=true) debería aparecer primero
      expect(resultado[0].id).toBe('cli-10');
      expect(resultado[0].frecuente).toBe(true);
    });

    it('debería limitar a 20 resultados', async () => {
      // Arrange - crear 25 clientes
      const muchos: Cliente[] = [];
      for (let i = 0; i < 25; i++) {
        muchos.push(
          new Cliente({
            id: `cli-multi-${i}`,
            comercioId,
            nombre: `Test ${i}`,
            rucCi: `${i}`,
            tipoDocumento: 'CI',
          })
        );
      }
      for (const c of muchos) {
        await repository.save(c);
      }

      // Act
      const resultado = await repository.buscar(comercioId, 'Test');

      // Assert
      expect(resultado).toHaveLength(20);
    });
  });

  describe('mapeo de tipo documento', () => {
    it('debería mapear CI', async () => {
      const cliente = new Cliente({
        id: 'cliente-tipo-ci',
        comercioId,
        nombre: 'Test CI',
        rucCi: '123',
        tipoDocumento: 'CI',
      });
      await repository.save(cliente);

      const found = await repository.findById('cliente-tipo-ci');
      expect(found?.tipoDocumento).toBe('CI');
    });

    it('debería mapear RUC', async () => {
      const cliente = new Cliente({
        id: 'cliente-tipo-ruc',
        comercioId,
        nombre: 'Test RUC',
        rucCi: '80012345-6',
        tipoDocumento: 'RUC',
      });
      await repository.save(cliente);

      const found = await repository.findById('cliente-tipo-ruc');
      expect(found?.tipoDocumento).toBe('RUC');
    });

    it('debería mapear pasaporte', async () => {
      const cliente = new Cliente({
        id: 'cliente-tipo-pasaporte',
        comercioId,
        nombre: 'Test Pasaporte',
        rucCi: 'AB123456',
        tipoDocumento: 'pasaporte',
      });
      await repository.save(cliente);

      const found = await repository.findById('cliente-tipo-pasaporte');
      expect(found?.tipoDocumento).toBe('pasaporte');
    });

    it('debería mapear innominado', async () => {
      const cliente = new Cliente({
        id: 'cliente-tipo-innominado',
        comercioId,
        nombre: 'Test Innominado',
        rucCi: '0',
        tipoDocumento: 'innominado',
      });
      await repository.save(cliente);

      const found = await repository.findById('cliente-tipo-innominado');
      expect(found?.tipoDocumento).toBe('innominado');
    });
  });
});
