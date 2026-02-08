import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { UsuarioRepositoryPg } from '../../../src/infrastructure/persistence/UsuarioRepositoryPg.js';
import { Usuario } from '../../../src/domain/usuario/Usuario.js';
import { Comercio } from '../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../src/domain/comercio/Timbrado.js';
import { ComercioRepositoryPg } from '../../../src/infrastructure/persistence/ComercioRepositoryPg.js';
import {
  getTestPrisma,
  cleanDatabase,
  disconnectTestDb,
  crearUsuarioTest,
} from '../helpers/testDb.js';

describe('UsuarioRepositoryPg - Integration Tests', () => {
  const prisma = getTestPrisma();
  const repository = new UsuarioRepositoryPg(prisma);
  const comercioRepository = new ComercioRepositoryPg(prisma);

  let comercioId: string;

  beforeAll(async () => {
    // Crear un comercio de prueba que será usado por todos los tests
    const comercio = new Comercio({
      id: 'comercio-usuario-test',
      ruc: new RUC('80069563-1'),
      razonSocial: 'Comercio para Usuarios',
      nombreFantasia: 'Usuarios Test',
      timbrado: new Timbrado('12345678', new Date('2025-01-01'), new Date('2027-12-31')),
      establecimiento: '001',
      puntoExpedicion: '001',
      tipoContribuyente: 1,
    });
    await comercioRepository.save(comercio);
    comercioId = comercio.id;
  });

  beforeEach(async () => {
    // Limpiar solo usuarios (mantener comercio)
    await prisma.usuario.deleteMany({});
  });

  afterAll(async () => {
    await cleanDatabase(prisma);
    await disconnectTestDb(prisma);
  });

  describe('save - crear usuario', () => {
    it('debería crear un usuario con todos los campos', async () => {
      // Arrange
      const props = crearUsuarioTest(comercioId);
      const usuario = new Usuario({
        id: 'usuario-001',
        comercioId: props.comercioId,
        nombre: props.nombre,
        telefono: props.telefono,
        pinHash: props.pinHash,
        rol: props.rol,
        activo: true,
      });

      // Act
      await repository.save(usuario);

      // Assert
      const found = await repository.findById('usuario-001');
      expect(found).not.toBeNull();
      expect(found?.id).toBe('usuario-001');
      expect(found?.nombre).toBe('Usuario Test');
      expect(found?.telefono).toBe('+595981234567');
      expect(found?.rol).toBe('dueño');
      expect(found?.activo).toBe(true);
      expect(found?.intentosFallidos).toBe(0);
      expect(found?.bloqueadoHasta).toBeNull();
    });

    it('debería crear usuario empleado', async () => {
      // Arrange
      const usuario = new Usuario({
        id: 'usuario-002',
        comercioId,
        nombre: 'Empleado Test',
        telefono: '+595981111111',
        pinHash: '$2b$10$hashedPin',
        rol: 'empleado',
        activo: true,
      });

      // Act
      await repository.save(usuario);

      // Assert
      const found = await repository.findById('usuario-002');
      expect(found?.rol).toBe('empleado');
    });
  });

  describe('save - actualizar usuario', () => {
    it('debería actualizar usuario existente', async () => {
      // Arrange - crear primero
      const usuario = new Usuario({
        id: 'usuario-003',
        comercioId,
        nombre: 'Original',
        telefono: '+595982222222',
        pinHash: '$2b$10$original',
        rol: 'dueño',
        activo: true,
      });
      await repository.save(usuario);

      // Act - actualizar
      const actualizado = usuario.actualizarNombre('Nombre Actualizado');
      await repository.save(actualizado);

      // Assert
      const found = await repository.findById('usuario-003');
      expect(found?.nombre).toBe('Nombre Actualizado');
    });

    it('debería actualizar intentos fallidos y bloqueadoHasta', async () => {
      // Arrange
      const usuario = new Usuario({
        id: 'usuario-004',
        comercioId,
        nombre: 'Test Bloqueo',
        telefono: '+595983333333',
        pinHash: '$2b$10$hash',
        rol: 'dueño',
        activo: true,
      });
      await repository.save(usuario);

      // Act - registrar intento fallido
      const conIntento = usuario.registrarIntentoFallido();
      await repository.save(conIntento);

      // Assert
      const found = await repository.findById('usuario-004');
      expect(found?.intentosFallidos).toBe(1);
      expect(found?.bloqueadoHasta).toBeNull();
    });

    it('debería persistir fecha de bloqueo', async () => {
      // Arrange
      const fechaBloqueo = new Date('2026-02-09T12:00:00Z');
      const usuario = new Usuario({
        id: 'usuario-005',
        comercioId,
        nombre: 'Test Bloqueado',
        telefono: '+595984444444',
        pinHash: '$2b$10$hash',
        rol: 'dueño',
        activo: true,
        intentosFallidos: 5,
        bloqueadoHasta: fechaBloqueo,
      });

      // Act
      await repository.save(usuario);

      // Assert
      const found = await repository.findById('usuario-005');
      expect(found?.bloqueadoHasta).not.toBeNull();
      expect(found?.bloqueadoHasta?.toISOString()).toBe(fechaBloqueo.toISOString());
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

  describe('findByTelefono', () => {
    it('debería encontrar usuario por teléfono', async () => {
      // Arrange
      const usuario = new Usuario({
        id: 'usuario-006',
        comercioId,
        nombre: 'Buscar por Tel',
        telefono: '+595985555555',
        pinHash: '$2b$10$hash',
        rol: 'dueño',
        activo: true,
      });
      await repository.save(usuario);

      // Act
      const found = await repository.findByTelefono('+595985555555');

      // Assert
      expect(found).not.toBeNull();
      expect(found?.id).toBe('usuario-006');
      expect(found?.nombre).toBe('Buscar por Tel');
    });

    it('debería retornar null si teléfono no existe', async () => {
      // Act
      const found = await repository.findByTelefono('+595999999999');

      // Assert
      expect(found).toBeNull();
    });
  });

  describe('mapeo de rol dueño ↔ dueno', () => {
    it('debería mapear dueño → dueno en DB → dueño en dominio', async () => {
      // Arrange
      const usuario = new Usuario({
        id: 'usuario-007',
        comercioId,
        nombre: 'Test Rol',
        telefono: '+595986666666',
        pinHash: '$2b$10$hash',
        rol: 'dueño',
        activo: true,
      });

      // Act
      await repository.save(usuario);

      // Assert - verificar en DB que se guardó como 'dueno'
      const row = await prisma.usuario.findUnique({ where: { id: 'usuario-007' } });
      expect(row?.rol).toBe('dueno');

      // Assert - verificar que al reconstruir vuelve a 'dueño'
      const found = await repository.findById('usuario-007');
      expect(found?.rol).toBe('dueño');
    });
  });
});
