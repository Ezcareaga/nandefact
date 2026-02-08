import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProcesarColaSifen } from '../../../../src/application/sync/ProcesarColaSifen.js';
import type { IFacturaRepository } from '../../../../src/domain/factura/IFacturaRepository.js';
import type { IFirmaDigital } from '../../../../src/domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../../../src/domain/factura/ISifenGateway.js';
import type { IXmlGenerator } from '../../../../src/domain/factura/IXmlGenerator.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../../../src/domain/cliente/IClienteRepository.js';
import type { ISyncQueue } from '../../../../src/domain/sync/ISyncQueue.js';
import type { ILogger } from '../../../../src/domain/shared/ILogger.js';
import { SyncJob } from '../../../../src/domain/sync/SyncJob.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';

describe('ProcesarColaSifen', () => {
  const timbrado = new Timbrado('12558946', new Date('2024-01-01'), new Date('2026-12-31'));
  const ruc = new RUC('80069563-1');
  const comercioId = '660e8400-e29b-41d4-a716-446655440000';
  const facturaId = '770e8400-e29b-41d4-a716-446655440000';

  let facturaRepository: IFacturaRepository;
  let comercioRepository: IComercioRepository;
  let clienteRepository: IClienteRepository;
  let xmlGenerator: IXmlGenerator;
  let firmaDigital: IFirmaDigital;
  let sifenGateway: ISifenGateway;
  let syncQueue: ISyncQueue;
  let logger: ILogger;
  let procesarColaSifen: ProcesarColaSifen;
  let testComercio: Comercio;
  let testCliente: Cliente;

  /**
   * Helper: Crea una factura en estado pendiente con items y CDC generado.
   */
  function crearFacturaPendiente(id: string, fecha: Date): Factura {
    const numeroFactura = new NumeroFactura('001', '003', '0001234');
    const factura = new Factura({
      id,
      comercioId,
      clienteId: '880e8400-e29b-41d4-a716-446655440000',
      tipoDocumento: 1 as const,
      timbrado,
      numeroFactura,
      tipoEmision: 1 as const,
      condicionPago: 'contado' as const,
      fechaEmision: fecha,
    });
    const item = new ItemFactura({
      descripcion: 'Mandioca',
      cantidad: 3,
      precioUnitario: 5000,
      tasaIVA: 10,
    });
    factura.agregarItem(item);
    factura.generarCDC(ruc, 1);
    return factura;
  }

  /**
   * Helper: Crea un SyncJob de prueba.
   */
  function crearSyncJob(jobId: string, fecha: Date, intentos = 0, cdcValue?: string): SyncJob {
    // Si no se pasa CDC, usar uno genérico (evita crear factura que puede fallar por timbrado expirado)
    const cdc = cdcValue ?? '01800695631001003000123412024011510123456789';
    return new SyncJob({
      id: jobId,
      comercioId,
      facturaId,
      cdc,
      fechaEmision: fecha,
      intentos,
      maxIntentos: 5,
      creadoEn: new Date(),
    });
  }

  beforeEach(() => {
    // Crear test comercio
    testComercio = new Comercio({
      id: comercioId,
      ruc,
      razonSocial: 'Comercio Test S.A.',
      nombreFantasia: 'Test Store',
      timbrado,
      establecimiento: '001',
      puntoExpedicion: '003',
      tipoContribuyente: 1,
    });

    // Crear test cliente
    testCliente = new Cliente({
      id: '880e8400-e29b-41d4-a716-446655440000',
      comercioId,
      nombre: 'Cliente Test',
      rucCi: '1234567-8',
      tipoDocumento: 'CI',
    });

    // Mocks
    facturaRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(null),
      findByComercio: vi.fn().mockResolvedValue([]),
      findPendientes: vi.fn().mockResolvedValue([]),
    };

    comercioRepository = {
      findById: vi.fn().mockResolvedValue(testComercio),
    };

    clienteRepository = {
      save: vi.fn().mockResolvedValue(undefined),
      findById: vi.fn().mockResolvedValue(testCliente),
      findByComercio: vi.fn().mockResolvedValue([]),
      buscar: vi.fn().mockResolvedValue([]),
    };

    xmlGenerator = {
      generarXml: vi.fn().mockResolvedValue('<DE><CDC>test</CDC></DE>'),
    };

    firmaDigital = {
      firmar: vi.fn().mockResolvedValue('<xml-firmado/>'),
    };

    sifenGateway = {
      enviarDE: vi.fn(),
      consultarEstado: vi.fn(),
      anularDE: vi.fn(),
      inutilizarNumeracion: vi.fn(),
    };

    syncQueue = {
      encolar: vi.fn().mockResolvedValue(undefined),
      desencolar: vi.fn().mockResolvedValue(null),
      completar: vi.fn().mockResolvedValue(undefined),
      fallar: vi.fn().mockResolvedValue(undefined),
      obtenerPendientes: vi.fn().mockResolvedValue([]),
      contarPendientes: vi.fn().mockResolvedValue(0),
    };

    logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    procesarColaSifen = new ProcesarColaSifen({
      facturaRepository,
      comercioRepository,
      clienteRepository,
      xmlGenerator,
      firmaDigital,
      sifenGateway,
      syncQueue,
      logger,
    });
  });

  it('debería procesar un job válido: load factura, sign XML, send to SIFEN, update estado, complete job', async () => {
    // Arrange
    const fecha = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const job = crearSyncJob('job1', fecha);
    const factura = crearFacturaPendiente(facturaId, fecha);

    vi.mocked(facturaRepository.findById).mockResolvedValue(factura);
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue({
      codigo: '0260',
      mensaje: 'Aprobado',
      cdc: factura.cdc!.value,
    });

    // Act
    const result = await procesarColaSifen.execute({ job });

    // Assert
    expect(logger.info).toHaveBeenCalledWith('Procesando job', {
      jobId: job.id,
      comercioId,
      cdc: job.cdc,
      intento: 1,
    });

    expect(facturaRepository.findById).toHaveBeenCalledWith(facturaId);
    expect(comercioRepository.findById).toHaveBeenCalledWith(comercioId);
    expect(clienteRepository.findById).toHaveBeenCalledWith(factura.clienteId);

    expect(xmlGenerator.generarXml).toHaveBeenCalledWith(factura, testComercio, testCliente);
    expect(firmaDigital.firmar).toHaveBeenCalledWith('<DE><CDC>test</CDC></DE>');
    expect(sifenGateway.enviarDE).toHaveBeenCalledWith('<xml-firmado/>');

    expect(factura.estado).toBe('aprobado'); // Estado final después de SIFEN
    expect(facturaRepository.save).toHaveBeenCalledWith(factura);
    expect(syncQueue.completar).toHaveBeenCalledWith(job.id);

    expect(logger.info).toHaveBeenCalledWith('Job completado', {
      facturaId,
      cdc: job.cdc,
      resultado: 'aprobado',
    });

    expect(result.exito).toBe(true);
    expect(result.facturaId).toBe(facturaId);
    expect(result.cdc).toBe(job.cdc);
    expect(result.error).toBeUndefined();
  });

  it('debería saltar factura expirada (>72h) y completar el job', async () => {
    // Arrange: Factura con 73 horas de antigüedad
    const fechaExpirada = new Date(Date.now() - 73 * 60 * 60 * 1000);
    const job = crearSyncJob('job1', fechaExpirada);

    // Act
    const result = await procesarColaSifen.execute({ job });

    // Assert
    expect(logger.warn).toHaveBeenCalledWith('Factura expirada (>72h)', {
      facturaId,
      cdc: job.cdc,
      fechaEmision: fechaExpirada,
    });

    expect(syncQueue.completar).toHaveBeenCalledWith(job.id);
    expect(facturaRepository.findById).not.toHaveBeenCalled(); // No procesar
    expect(sifenGateway.enviarDE).not.toHaveBeenCalled();

    expect(result.exito).toBe(false);
    expect(result.error).toBe('Factura expirada: superó ventana de 72 horas SIFEN');
  });

  it('debería manejar rechazo de SIFEN (0300): mark rechazada, complete job (no retry)', async () => {
    // Arrange
    const fecha = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const job = crearSyncJob('job1', fecha);
    const factura = crearFacturaPendiente(facturaId, fecha);

    vi.mocked(facturaRepository.findById).mockResolvedValue(factura);
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue({
      codigo: '0300',
      mensaje: 'Error de validación',
      cdc: factura.cdc!.value,
    });

    // Act
    const result = await procesarColaSifen.execute({ job });

    // Assert
    expect(factura.estado).toBe('rechazado');
    expect(facturaRepository.save).toHaveBeenCalledWith(factura);
    expect(syncQueue.completar).toHaveBeenCalledWith(job.id);
    expect(syncQueue.fallar).not.toHaveBeenCalled(); // No retry para rechazos de SIFEN

    expect(result.exito).toBe(true); // Comunicación exitosa, no hubo excepción
    expect(result.facturaId).toBe(facturaId);
  });

  it('debería re-encolar en error de red cuando retries remaining (call syncQueue.fallar)', async () => {
    // Arrange
    const fecha = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const job = crearSyncJob('job1', fecha, 2); // 2 intentos previos, puede reintentar
    const factura = crearFacturaPendiente(facturaId, fecha);

    vi.mocked(facturaRepository.findById).mockResolvedValue(factura);
    vi.mocked(sifenGateway.enviarDE).mockRejectedValue(new Error('Network timeout'));

    // Act
    const result = await procesarColaSifen.execute({ job });

    // Assert
    expect(syncQueue.fallar).toHaveBeenCalledWith(job, 'Network timeout');
    expect(syncQueue.completar).not.toHaveBeenCalled(); // No completar, reintentar

    expect(logger.error).toHaveBeenCalledWith('Job fallido, reintentando', {
      facturaId,
      cdc: job.cdc,
      intento: 3,
      error: 'Network timeout',
    });

    expect(result.exito).toBe(false);
    expect(result.error).toBe('Network timeout');
  });

  it('debería dar up after max retries (call syncQueue.completar)', async () => {
    // Arrange
    const fecha = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const job = crearSyncJob('job1', fecha, 5); // 5 intentos = máximo alcanzado
    const factura = crearFacturaPendiente(facturaId, fecha);

    vi.mocked(facturaRepository.findById).mockResolvedValue(factura);
    vi.mocked(sifenGateway.enviarDE).mockRejectedValue(new Error('Permanent error'));

    // Act
    const result = await procesarColaSifen.execute({ job });

    // Assert
    expect(syncQueue.completar).toHaveBeenCalledWith(job.id); // Give up
    expect(syncQueue.fallar).not.toHaveBeenCalled();

    expect(logger.error).toHaveBeenCalledWith('Job fallido, máximo reintentos alcanzado', {
      facturaId,
      cdc: job.cdc,
      intentos: 5,
    });

    expect(result.exito).toBe(false);
    expect(result.error).toBe('Permanent error');
  });

  it('debería loggear todo el procesamiento con comercioId y CDC context', async () => {
    // Arrange
    const fecha = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const job = crearSyncJob('job1', fecha);
    const factura = crearFacturaPendiente(facturaId, fecha);

    vi.mocked(facturaRepository.findById).mockResolvedValue(factura);
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue({
      codigo: '0260',
      mensaje: 'Aprobado',
      cdc: factura.cdc!.value,
    });

    // Act
    await procesarColaSifen.execute({ job });

    // Assert: Todos los logs incluyen context con comercioId y cdc
    expect(logger.info).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        comercioId,
        cdc: job.cdc,
      }),
    );
  });

  it('debería saltar facturas already-approved (complete job sin processing)', async () => {
    // Arrange
    const fecha = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
    const job = crearSyncJob('job1', fecha);
    const factura = crearFacturaPendiente(facturaId, fecha);
    factura.marcarEnviada();
    factura.marcarAprobada(); // Ya aprobada

    vi.mocked(facturaRepository.findById).mockResolvedValue(factura);

    // Act
    const result = await procesarColaSifen.execute({ job });

    // Assert
    expect(sifenGateway.enviarDE).not.toHaveBeenCalled(); // No enviar
    expect(syncQueue.completar).toHaveBeenCalledWith(job.id);

    expect(result.exito).toBe(true); // No es error, ya estaba aprobada
    expect(result.facturaId).toBe(facturaId);
  });
});
