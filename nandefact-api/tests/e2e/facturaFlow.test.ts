/**
 * E2E test: flujo completo de facturación.
 * Ejercita HTTP layer, PostgreSQL, y adaptadores reales (excepto SIFEN mock).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { createTestServer, getAuthToken } from './helpers/testServer.js';

describe('E2E: Flujo de Facturación', () => {
  let app: Express;
  let prisma: PrismaClient;
  let cleanup: () => Promise<void>;
  let comercioId: string;
  let usuarioId: string;
  let accessToken: string;
  let productoIds: string[] = [];
  let clienteId: string;

  beforeAll(async () => {
    const testServer = createTestServer();
    app = testServer.app;
    prisma = testServer.prisma;
    cleanup = testServer.cleanup;

    // Seed: Comercio
    const comercio = await prisma.comercio.create({
      data: {
        nombre: 'Test Comercio E2E',
        ruc: '80069563-1',
        razonSocial: 'Test SA',
        nombreFantasia: 'Test Store',
        establecimiento: '001',
        puntoExpedicion: '001',
        timbrado: '12345678',
        timbradoFechaInicio: new Date('2024-01-01'),
        timbradoFechaFin: new Date('2025-12-31'),
        direccion: 'Calle Test 123',
        numeroCasa: '123',
        departamento: 11,
        departamentoDesc: 'Central',
        distrito: 1,
        distritoDesc: 'Asunción',
        ciudad: 1,
        ciudadDesc: 'Asunción',
        telefono: '+595981123456',
        email: 'test@test.com',
        rubro: 'Comercio',
        actividadEconomicaCodigo: '4711',
        actividadEconomicaDesc: 'Venta al por menor',
        tipoContribuyente: 1,
        tipoRegimen: 8,
        activo: true,
      },
    });
    comercioId = comercio.id;

    // Seed: Usuario con PIN "1234" (hasheado por bcrypt)
    // Hash de "1234" generado con bcrypt rounds=10
    const usuario = await prisma.usuario.create({
      data: {
        comercioId,
        nombre: 'Usuario Test',
        telefono: '+595981000001',
        pinHash: '$2b$10$JQx8Ll4OYnDkZkOLbZp6dO2JmPJP5LcfZ6h5YhLvH4jH8uCkT/Kom', // "1234"
        rol: 'dueno',
        activo: true,
      },
    });
    usuarioId = usuario.id;

    // Seed: 3 Productos
    const producto1 = await prisma.producto.create({
      data: {
        comercioId,
        nombre: 'Mandioca',
        codigo: 'MAN001',
        precioUnitario: BigInt(5000),
        unidadMedida: 'KG',
        ivaTipo: 'TASA_5',
        categoria: 'Verduras',
        activo: true,
      },
    });
    const producto2 = await prisma.producto.create({
      data: {
        comercioId,
        nombre: 'Arroz',
        codigo: 'ARR001',
        precioUnitario: BigInt(8000),
        unidadMedida: 'KG',
        ivaTipo: 'TASA_5',
        categoria: 'Granos',
        activo: true,
      },
    });
    const producto3 = await prisma.producto.create({
      data: {
        comercioId,
        nombre: 'Aceite',
        codigo: 'ACE001',
        precioUnitario: BigInt(15000),
        unidadMedida: 'UNIDAD',
        ivaTipo: 'TASA_10',
        categoria: 'Aceites',
        activo: true,
      },
    });
    productoIds = [producto1.id, producto2.id, producto3.id];

    // Seed: 1 Cliente
    const cliente = await prisma.cliente.create({
      data: {
        comercioId,
        nombre: 'Juan Pérez',
        rucCi: '1234567',
        tipoDocumento: 'CI',
        telefono: '+595981999888',
        email: 'juan@example.com',
        direccion: 'Barrio Test',
        frecuente: true,
        enviarWhatsapp: true,
      },
    });
    clienteId = cliente.id;

    // Obtener access token
    const tokens = await getAuthToken(app, '+595981000001', '1234');
    accessToken = tokens.accessToken;
  });

  afterAll(async () => {
    // Cleanup: eliminar datos de test
    await prisma.factura.deleteMany({ where: { comercioId } });
    await prisma.cliente.deleteMany({ where: { comercioId } });
    await prisma.producto.deleteMany({ where: { comercioId } });
    await prisma.usuario.deleteMany({ where: { comercioId } });
    await prisma.comercio.delete({ where: { id: comercioId } });

    await cleanup();
  });

  describe('Auth Flow', () => {
    it('POST /api/v1/auth/login - autentica con teléfono + PIN', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        telefono: '+595981000001',
        pin: '1234',
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('POST /api/v1/auth/login - rechaza PIN incorrecto', async () => {
      const response = await request(app).post('/api/v1/auth/login').send({
        telefono: '+595981000001',
        pin: '9999',
      });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('POST /api/v1/auth/refresh - refresca tokens', async () => {
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        telefono: '+595981000001',
        pin: '1234',
      });

      const refreshToken = loginRes.body.data.refreshToken as string;

      const response = await request(app).post('/api/v1/auth/refresh').send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });
  });

  describe('Health Check', () => {
    it('GET /health - retorna ok sin auth', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Productos Flow', () => {
    it('POST /api/v1/productos - crea producto', async () => {
      const response = await request(app)
        .post('/api/v1/productos')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          nombre: 'Tomate',
          codigo: 'TOM001',
          precioUnitario: 6000,
          unidadMedida: 'KG',
          ivaTipo: '5%',
          categoria: 'Verduras',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nombre).toBe('Tomate');
    });

    it('GET /api/v1/productos - lista productos', async () => {
      const response = await request(app)
        .get('/api/v1/productos')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data.items.length).toBeGreaterThan(0);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
    });
  });

  describe('Clientes Flow', () => {
    it('POST /api/v1/clientes - crea cliente', async () => {
      const response = await request(app)
        .post('/api/v1/clientes')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          nombre: 'María González',
          rucCi: '7654321',
          tipoDocumento: 'CI',
          telefono: '+595981888777',
          direccion: 'Barrio Nuevo',
          frecuente: false,
          enviarWhatsapp: false,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nombre).toBe('María González');
    });

    it('GET /api/v1/clientes/buscar?q=Juan - busca clientes', async () => {
      const response = await request(app)
        .get('/api/v1/clientes/buscar?q=Juan')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].nombre).toContain('Juan');
    });
  });

  describe('Facturas Flow', () => {
    let facturaId: string;

    it('POST /api/v1/facturas - crea factura', async () => {
      const response = await request(app)
        .post('/api/v1/facturas')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          clienteId,
          items: [
            {
              productoId: productoIds[0],
              cantidad: 3,
              precioUnitario: 5000,
            },
            {
              productoId: productoIds[1],
              cantidad: 2,
              precioUnitario: 8000,
            },
          ],
          condicionPago: 'contado',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('cdc');
      expect(response.body.data.cdc).toMatch(/^\d{44}$/); // 44 dígitos
      expect(response.body.data.estado).toBe('pendiente');

      facturaId = response.body.data.id as string;
    });

    it('GET /api/v1/facturas/:id - obtiene factura creada', async () => {
      const response = await request(app)
        .get(`/api/v1/facturas/${facturaId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(facturaId);
      expect(response.body.data).toHaveProperty('items');
      expect(response.body.data.items.length).toBe(2);
    });

    it('GET /api/v1/facturas - lista facturas con paginación', async () => {
      const response = await request(app)
        .get('/api/v1/facturas?page=1&pageSize=10')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.items).toBeInstanceOf(Array);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('pageSize');
    });
  });
});
