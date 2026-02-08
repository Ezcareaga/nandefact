import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnviarKuDE } from '../../../../src/application/facturacion/EnviarKuDE.js';
import type { IFacturaRepository } from '../../../../src/domain/factura/IFacturaRepository.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import type { IClienteRepository } from '../../../../src/domain/cliente/IClienteRepository.js';
import type { IKudeGenerator } from '../../../../src/domain/factura/IKudeGenerator.js';
import type { INotificador } from '../../../../src/domain/factura/INotificador.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';
import { FacturaNoEncontradaError } from '../../../../src/application/errors/FacturaNoEncontradaError.js';

describe('EnviarKuDE', () => {
  let useCase: EnviarKuDE;
  let mockFacturaRepo: IFacturaRepository;
  let mockComercioRepo: IComercioRepository;
  let mockClienteRepo: IClienteRepository;
  let mockKudeGenerator: IKudeGenerator;
  let mockNotificador: INotificador;

  let factura: Factura;
  let comercio: Comercio;
  let cliente: Cliente;

  beforeEach(() => {
    // Setup mocks
    mockFacturaRepo = {
      findById: vi.fn(),
      save: vi.fn(),
      findPendientes: vi.fn()
    } as any;

    mockComercioRepo = {
      findById: vi.fn()
    } as any;

    mockClienteRepo = {
      findById: vi.fn()
    } as any;

    mockKudeGenerator = {
      generar: vi.fn()
    } as any;

    mockNotificador = {
      enviarKuDE: vi.fn()
    } as any;

    useCase = new EnviarKuDE({
      facturaRepository: mockFacturaRepo,
      comercioRepository: mockComercioRepo,
      clienteRepository: mockClienteRepo,
      kudeGenerator: mockKudeGenerator,
      notificador: mockNotificador
    });

    // Setup test data
    const ruc = new RUC('80069563-1');
    const timbrado = new Timbrado('12345678', new Date('2024-01-01'), new Date('2024-12-31'));

    comercio = new Comercio({
      id: 'comercio-1',
      ruc,
      razonSocial: 'Comercio Test SA',
      nombreFantasia: 'Test Store',
      establecimiento: '001',
      puntoExpedicion: '001',
      timbrado,
      tipoContribuyente: 2
    });

    cliente = new Cliente({
      id: 'cliente-1',
      comercioId: 'comercio-1',
      nombre: 'Cliente Test',
      rucCi: '12345678',
      tipoDocumento: 'CI',
      telefono: '0981123456',
      enviarWhatsApp: true
    });

    factura = new Factura({
      id: 'factura-1',
      comercioId: 'comercio-1',
      clienteId: 'cliente-1',
      tipoDocumento: 1,
      timbrado,
      numeroFactura: new NumeroFactura('001', '001', '0000001'),
      tipoEmision: 1,
      fechaEmision: new Date('2024-01-15'),
      condicionPago: 'contado'
    });

    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto A', cantidad: 2, precioUnitario: 10000, tasaIVA: 10 })
    );
    factura.generarCDC(ruc, comercio.tipoContribuyente);
    factura.marcarEnviada();
    factura.marcarAprobada();

    // Default mocks return values
    vi.mocked(mockFacturaRepo.findById).mockResolvedValue(factura);
    vi.mocked(mockComercioRepo.findById).mockResolvedValue(comercio);
    vi.mocked(mockClienteRepo.findById).mockResolvedValue(cliente);
    vi.mocked(mockKudeGenerator.generar).mockResolvedValue(Buffer.from('fake-pdf'));
    vi.mocked(mockNotificador.enviarKuDE).mockResolvedValue();
  });

  describe('happy path', () => {
    it('debe generar PDF y enviar notificación cuando cliente tiene telefono + enviarWhatsApp=true', async () => {
      const result = await useCase.execute({ facturaId: 'factura-1' });

      expect(result.pdfGenerado).toBe(true);
      expect(result.notificacionEnviada).toBe(true);
      expect(result.telefono).toBe('0981123456');

      expect(mockKudeGenerator.generar).toHaveBeenCalledWith(factura, comercio, cliente);
      expect(mockNotificador.enviarKuDE).toHaveBeenCalledWith('0981123456', Buffer.from('fake-pdf'));
    });

    it('debe generar PDF pero NO enviar notificación cuando cliente no tiene telefono', async () => {
      const clienteSinTelefono = new Cliente({
        id: 'cliente-2',
        comercioId: 'comercio-1',
        nombre: 'Cliente Sin Tel',
        rucCi: '87654321',
        tipoDocumento: 'CI',
        enviarWhatsApp: true
      });
      vi.mocked(mockClienteRepo.findById).mockResolvedValue(clienteSinTelefono);

      const result = await useCase.execute({ facturaId: 'factura-1' });

      expect(result.pdfGenerado).toBe(true);
      expect(result.notificacionEnviada).toBe(false);
      expect(result.telefono).toBeNull();

      expect(mockKudeGenerator.generar).toHaveBeenCalled();
      expect(mockNotificador.enviarKuDE).not.toHaveBeenCalled();
    });

    it('debe generar PDF pero NO enviar notificación cuando enviarWhatsApp=false', async () => {
      const clienteNoEnviar = new Cliente({
        id: 'cliente-3',
        comercioId: 'comercio-1',
        nombre: 'Cliente No Enviar',
        rucCi: '11111111',
        tipoDocumento: 'CI',
        telefono: '0981999999',
        enviarWhatsApp: false
      });
      vi.mocked(mockClienteRepo.findById).mockResolvedValue(clienteNoEnviar);

      const result = await useCase.execute({ facturaId: 'factura-1' });

      expect(result.pdfGenerado).toBe(true);
      expect(result.notificacionEnviada).toBe(false);
      expect(result.telefono).toBe('0981999999');

      expect(mockKudeGenerator.generar).toHaveBeenCalled();
      expect(mockNotificador.enviarKuDE).not.toHaveBeenCalled();
    });

    it('debe generar PDF para factura cancelada (además de aprobada)', async () => {
      factura.marcarCancelada();
      vi.mocked(mockFacturaRepo.findById).mockResolvedValue(factura);

      const result = await useCase.execute({ facturaId: 'factura-1' });

      expect(result.pdfGenerado).toBe(true);
      expect(mockKudeGenerator.generar).toHaveBeenCalled();
    });
  });

  describe('validaciones', () => {
    it('debe lanzar FacturaNoEncontradaError si factura no existe', async () => {
      vi.mocked(mockFacturaRepo.findById).mockResolvedValue(null);

      await expect(useCase.execute({ facturaId: 'inexistente' }))
        .rejects.toThrow(FacturaNoEncontradaError);
    });

    it('debe lanzar error si factura en estado pendiente', async () => {
      // Crear factura pendiente
      const facturaPendiente = new Factura({
        id: 'factura-2',
        comercioId: 'comercio-1',
        clienteId: 'cliente-1',
        tipoDocumento: 1,
        timbrado: new Timbrado('12345678', new Date('2024-01-01'), new Date('2024-12-31')),
        numeroFactura: new NumeroFactura('001', '001', '0000002'),
        tipoEmision: 1,
        fechaEmision: new Date('2024-01-15'),
        condicionPago: 'contado'
      });
      facturaPendiente.agregarItem(
        new ItemFactura({ descripcion: 'Test', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 })
      );

      vi.mocked(mockFacturaRepo.findById).mockResolvedValue(facturaPendiente);

      await expect(useCase.execute({ facturaId: 'factura-2' }))
        .rejects.toThrow('No se puede generar KuDE');
    });

    it('debe lanzar error si factura no tiene CDC', async () => {
      const facturaSinCdc = new Factura({
        id: 'factura-3',
        comercioId: 'comercio-1',
        clienteId: 'cliente-1',
        tipoDocumento: 1,
        timbrado: new Timbrado('12345678', new Date('2024-01-01'), new Date('2024-12-31')),
        numeroFactura: new NumeroFactura('001', '001', '0000003'),
        tipoEmision: 1,
        fechaEmision: new Date('2024-01-15'),
        condicionPago: 'contado'
      });
      facturaSinCdc.agregarItem(
        new ItemFactura({ descripcion: 'Test', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 })
      );
      facturaSinCdc.marcarEnviada();
      facturaSinCdc.marcarAprobada(); // Aprobada pero sin CDC (caso edge)

      vi.mocked(mockFacturaRepo.findById).mockResolvedValue(facturaSinCdc);

      await expect(useCase.execute({ facturaId: 'factura-3' }))
        .rejects.toThrow('no tiene CDC generado');
    });

    it('debe lanzar error si comercio no encontrado', async () => {
      vi.mocked(mockComercioRepo.findById).mockResolvedValue(null);

      await expect(useCase.execute({ facturaId: 'factura-1' }))
        .rejects.toThrow('Comercio no encontrado');
    });

    it('debe lanzar error si cliente no encontrado', async () => {
      vi.mocked(mockClienteRepo.findById).mockResolvedValue(null);

      await expect(useCase.execute({ facturaId: 'factura-1' }))
        .rejects.toThrow('Cliente no encontrado');
    });
  });
});
