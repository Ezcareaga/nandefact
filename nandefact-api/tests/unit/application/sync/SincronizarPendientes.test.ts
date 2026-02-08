import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SincronizarPendientes } from '../../../../src/application/sync/SincronizarPendientes.js';
import type { IFacturaRepository } from '../../../../src/domain/factura/IFacturaRepository.js';
import type { IFirmaDigital } from '../../../../src/domain/factura/IFirmaDigital.js';
import type { ISifenGateway } from '../../../../src/domain/factura/ISifenGateway.js';
import type { IXmlGenerator } from '../../../../src/domain/factura/IXmlGenerator.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../../../src/domain/cliente/IClienteRepository.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';

describe('SincronizarPendientes', () => {
  const timbrado = new Timbrado('12558946', new Date('2024-01-01'), new Date('2025-12-31'));
  const ruc = new RUC('80069563-1');
  const comercioId = '660e8400-e29b-41d4-a716-446655440000';

  let facturaRepository: IFacturaRepository;
  let comercioRepository: IComercioRepository;
  let clienteRepository: IClienteRepository;
  let xmlGenerator: IXmlGenerator;
  let firmaDigital: IFirmaDigital;
  let sifenGateway: ISifenGateway;
  let sincronizarPendientes: SincronizarPendientes;
  let testComercio: Comercio;
  let testCliente: Cliente;

  /**
   * Helper: Crea una factura en estado pendiente con items y CDC generado.
   */
  function crearFacturaPendiente(id: string, fecha: Date): Factura {
    // Generar número de 7 dígitos basado en el ID
    const hashCode = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const numero = String(hashCode % 10000000).padStart(7, '0');
    const numeroFactura = new NumeroFactura('001', '003', numero);
    const factura = new Factura({
      id,
      comercioId,
      clienteId: '770e8400-e29b-41d4-a716-446655440000',
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
      id: '770e8400-e29b-41d4-a716-446655440000',
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
    };

    sincronizarPendientes = new SincronizarPendientes({
      facturaRepository,
      comercioRepository,
      clienteRepository,
      xmlGenerator,
      firmaDigital,
      sifenGateway,
    });
  });

  it('debería procesar todas las facturas pendientes en orden FIFO (más antigua primero)', async () => {
    // Arrange: 3 facturas con fechas diferentes
    const factura1 = crearFacturaPendiente('f1', new Date('2024-01-15')); // Más antigua
    const factura2 = crearFacturaPendiente('f2', new Date('2024-02-15'));
    const factura3 = crearFacturaPendiente('f3', new Date('2024-03-15')); // Más reciente

    // findPendientes devuelve en orden desordenado
    vi.mocked(facturaRepository.findPendientes).mockResolvedValue([
      factura3,
      factura1,
      factura2,
    ]);

    // Todas aprobadas
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue({
      codigo: '0260',
      mensaje: 'Aprobado',
      cdc: factura1.cdc!.value,
    });

    // Act
    const result = await sincronizarPendientes.execute({ comercioId });

    // Assert: Procesadas en orden FIFO
    expect(facturaRepository.findPendientes).toHaveBeenCalledWith(comercioId);
    expect(result.totalProcesadas).toBe(3);
    expect(result.exitosas).toBe(3);
    expect(result.fallidas).toBe(0);
    expect(result.resultados).toHaveLength(3);

    // Verificar orden de procesamiento (más antigua primero)
    const saveCallOrder = vi.mocked(facturaRepository.save).mock.calls;
    expect(saveCallOrder[0][0].id).toBe('f1'); // Primera en procesarse
    expect(saveCallOrder[1][0].id).toBe('f2');
    expect(saveCallOrder[2][0].id).toBe('f3'); // Última en procesarse
  });

  it('debería continuar procesando aunque una factura falle', async () => {
    // Arrange: 3 facturas
    const factura1 = crearFacturaPendiente('f1', new Date('2024-01-15'));
    const factura2 = crearFacturaPendiente('f2', new Date('2024-02-15'));
    const factura3 = crearFacturaPendiente('f3', new Date('2024-03-15'));

    vi.mocked(facturaRepository.findPendientes).mockResolvedValue([
      factura1,
      factura2,
      factura3,
    ]);

    // factura2 falla con excepción, las demás exitosas
    vi.mocked(sifenGateway.enviarDE)
      .mockResolvedValueOnce({
        codigo: '0260',
        mensaje: 'Aprobado',
        cdc: factura1.cdc!.value,
      })
      .mockRejectedValueOnce(new Error('Network timeout'))
      .mockResolvedValueOnce({
        codigo: '0260',
        mensaje: 'Aprobado',
        cdc: factura3.cdc!.value,
      });

    // Act
    const result = await sincronizarPendientes.execute({ comercioId });

    // Assert: Continúa procesando pese al error
    expect(result.totalProcesadas).toBe(3);
    expect(result.exitosas).toBe(2);
    expect(result.fallidas).toBe(1);

    // Verificar resultados individuales
    expect(result.resultados[0]).toMatchObject({
      facturaId: 'f1',
      exito: true,
    });
    expect(result.resultados[1]).toMatchObject({
      facturaId: 'f2',
      exito: false,
      error: 'Network timeout',
    });
    expect(result.resultados[2]).toMatchObject({
      facturaId: 'f3',
      exito: true,
    });

    // Verificar que las 3 se intentaron guardar (incluso la fallida para actualizar estado)
    expect(facturaRepository.save).toHaveBeenCalledTimes(3);
  });

  it('debería retornar resultado vacío si no hay facturas pendientes', async () => {
    // Arrange: Sin facturas pendientes
    vi.mocked(facturaRepository.findPendientes).mockResolvedValue([]);

    // Act
    const result = await sincronizarPendientes.execute({ comercioId });

    // Assert
    expect(result.totalProcesadas).toBe(0);
    expect(result.exitosas).toBe(0);
    expect(result.fallidas).toBe(0);
    expect(result.resultados).toHaveLength(0);
    expect(facturaRepository.save).not.toHaveBeenCalled();
    expect(firmaDigital.firmar).not.toHaveBeenCalled();
  });

  it('debería firmar y enviar cada factura individualmente', async () => {
    // Arrange: 2 facturas
    const factura1 = crearFacturaPendiente('f1', new Date('2024-01-15'));
    const factura2 = crearFacturaPendiente('f2', new Date('2024-02-15'));

    vi.mocked(facturaRepository.findPendientes).mockResolvedValue([factura1, factura2]);

    vi.mocked(sifenGateway.enviarDE).mockResolvedValue({
      codigo: '0260',
      mensaje: 'Aprobado',
      cdc: factura1.cdc!.value,
    });

    // Act
    await sincronizarPendientes.execute({ comercioId });

    // Assert: Verificar llamadas individuales
    expect(firmaDigital.firmar).toHaveBeenCalledTimes(2);
    expect(sifenGateway.enviarDE).toHaveBeenCalledTimes(2);
    expect(sifenGateway.enviarDE).toHaveBeenCalledWith('<xml-firmado/>');
  });

  it('debería guardar cada factura después de procesarla', async () => {
    // Arrange: 2 facturas
    const factura1 = crearFacturaPendiente('f1', new Date('2024-01-15'));
    const factura2 = crearFacturaPendiente('f2', new Date('2024-02-15'));

    vi.mocked(facturaRepository.findPendientes).mockResolvedValue([factura1, factura2]);

    vi.mocked(sifenGateway.enviarDE).mockResolvedValue({
      codigo: '0260',
      mensaje: 'Aprobado',
      cdc: factura1.cdc!.value,
    });

    // Act
    await sincronizarPendientes.execute({ comercioId });

    // Assert: Cada factura guardada después de procesar
    expect(facturaRepository.save).toHaveBeenCalledTimes(2);
    expect(facturaRepository.save).toHaveBeenCalledWith(factura1);
    expect(facturaRepository.save).toHaveBeenCalledWith(factura2);
  });

  it('debería marcar factura como rechazada cuando SIFEN retorna 0300 (exito=true pues comunicación funcionó)', async () => {
    // Arrange: 1 factura rechazada por SIFEN
    const factura1 = crearFacturaPendiente('f1', new Date('2024-01-15'));

    vi.mocked(facturaRepository.findPendientes).mockResolvedValue([factura1]);

    // SIFEN rechaza con código 0300 (error de validación)
    vi.mocked(sifenGateway.enviarDE).mockResolvedValue({
      codigo: '0300',
      mensaje: 'Error de validación',
      cdc: factura1.cdc!.value,
    });

    // Act
    const result = await sincronizarPendientes.execute({ comercioId });

    // Assert: Comunicación exitosa (no hubo excepción), pero factura rechazada
    expect(result.totalProcesadas).toBe(1);
    expect(result.exitosas).toBe(1); // Comunicación funcionó
    expect(result.fallidas).toBe(0); // Sin errores de red/excepción
    expect(result.resultados[0]).toMatchObject({
      facturaId: 'f1',
      exito: true, // Proceso completado
      cdc: factura1.cdc!.value,
    });

    // Factura marcada como rechazada
    expect(factura1.estado).toBe('rechazado');
    expect(facturaRepository.save).toHaveBeenCalledWith(factura1);
  });

  it('debería llamar a xmlGenerator para cada factura pendiente', async () => {
    // Arrange: 2 facturas
    const factura1 = crearFacturaPendiente('f1', new Date('2024-01-15'));
    const factura2 = crearFacturaPendiente('f2', new Date('2024-02-15'));

    vi.mocked(facturaRepository.findPendientes).mockResolvedValue([factura1, factura2]);

    vi.mocked(sifenGateway.enviarDE).mockResolvedValue({
      codigo: '0260',
      mensaje: 'Aprobado',
      cdc: factura1.cdc!.value,
    });

    // Act
    await sincronizarPendientes.execute({ comercioId });

    // Assert: xmlGenerator llamado para cada factura
    expect(xmlGenerator.generarXml).toHaveBeenCalledTimes(2);
    expect(xmlGenerator.generarXml).toHaveBeenNthCalledWith(1, factura1, testComercio, testCliente);
    expect(xmlGenerator.generarXml).toHaveBeenNthCalledWith(2, factura2, testComercio, testCliente);
  });
});
