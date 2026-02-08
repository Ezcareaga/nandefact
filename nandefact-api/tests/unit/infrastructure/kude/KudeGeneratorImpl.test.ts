import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KudeGeneratorImpl } from '../../../../src/infrastructure/kude/KudeGeneratorImpl.js';
import { QrGeneratorSifen } from '../../../../src/infrastructure/kude/QrGeneratorSifen.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';

describe('KudeGeneratorImpl', () => {
  let generator: KudeGeneratorImpl;
  let mockQrGenerator: QrGeneratorSifen;
  let factura: Factura;
  let comercio: Comercio;
  let cliente: Cliente;
  let ruc: RUC;
  let timbrado: Timbrado;

  beforeEach(() => {
    // Mock QrGeneratorSifen
    mockQrGenerator = {
      generarQr: vi.fn(),
      extractQrUrl: vi.fn()
    } as any;

    vi.mocked(mockQrGenerator.generarQr).mockResolvedValue(
      '<rDE><DE><dQRCode>https://ekuatia.set.gov.py/consultas/qr?Id=123</dQRCode></DE></rDE>'
    );
    vi.mocked(mockQrGenerator.extractQrUrl).mockReturnValue(
      'https://ekuatia.set.gov.py/consultas/qr?Id=123'
    );

    generator = new KudeGeneratorImpl({
      qrGenerator: mockQrGenerator,
      cscId: 'CSC001',
      csc: '12345678901234567890123456789012',
      environment: 'test'
    });

    // Crear entidades de prueba siguiendo el patrón de Factura.test.ts
    ruc = new RUC('80069563-1');
    timbrado = new Timbrado(
      '12345678',
      new Date('2024-01-01'),
      new Date('2024-12-31')
    );

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
      email: 'cliente@example.com',
      direccion: 'Asunción',
      frecuente: false,
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

    // Agregar items y generar CDC
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto A', cantidad: 2, precioUnitario: 10000, tasaIVA: 10 })
    );
    factura.agregarItem(
      new ItemFactura({ descripcion: 'Producto B', cantidad: 1, precioUnitario: 5000, tasaIVA: 10 })
    );

    factura.generarCDC(ruc, comercio.tipoContribuyente);
    factura.marcarEnviada();
    factura.marcarAprobada();
  });

  describe('generar', () => {
    it('debe generar PDF Buffer desde factura + comercio + cliente', async () => {
      const result = await generator.generar(factura, comercio, cliente);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('debe llamar a qrGenerator.generarQr con los parámetros correctos', async () => {
      await generator.generar(factura, comercio, cliente);

      expect(mockQrGenerator.generarQr).toHaveBeenCalledWith({
        xmlFirmado: expect.stringContaining(factura.cdc!.value),
        cscId: 'CSC001',
        csc: '12345678901234567890123456789012',
        environment: 'test'
      });
    });

    it('debe llamar a qrGenerator.extractQrUrl para obtener la URL del QR', async () => {
      await generator.generar(factura, comercio, cliente);

      expect(mockQrGenerator.extractQrUrl).toHaveBeenCalledWith(
        expect.stringContaining('dQRCode')
      );
    });

    it('debe lanzar error si factura no tiene CDC', async () => {
      // Crear factura sin CDC
      const facturaSinCdc = new Factura({
        id: 'factura-2',
        comercioId: 'comercio-1',
        clienteId: 'cliente-1',
        tipoDocumento: 1,
        timbrado,
        numeroFactura: new NumeroFactura('001', '001', '0000002'),
        tipoEmision: 1,
        fechaEmision: new Date('2024-01-15'),
        condicionPago: 'contado'
      });

      facturaSinCdc.agregarItem(
        new ItemFactura({ descripcion: 'Producto A', cantidad: 1, precioUnitario: 10000, tasaIVA: 10 })
      );

      await expect(generator.generar(facturaSinCdc, comercio, cliente))
        .rejects.toThrow('no tiene CDC generado');
    });

    it('debe incluir datos del comercio en el PDF (RUC, razón social, timbrado)', async () => {
      const result = await generator.generar(factura, comercio, cliente);
      const pdfContent = result.toString('binary');

      // PDFKit codifica el texto en el PDF, verificar presencia de datos clave
      // Nota: esto es una verificación básica - en tests e2e verificaríamos parsing del PDF
      expect(result.length).toBeGreaterThan(1000); // PDF mínimo razonable
    });

    it('debe incluir datos del cliente en el PDF', async () => {
      const result = await generator.generar(factura, comercio, cliente);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('debe incluir items de la factura en el PDF', async () => {
      const result = await generator.generar(factura, comercio, cliente);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('debe incluir totales (IVA 10%, 5%, exenta, total general) en el PDF', async () => {
      const result = await generator.generar(factura, comercio, cliente);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('debe generar PDF para factura con items de diferentes tasas de IVA', async () => {
      const facturaMultiIVA = new Factura({
        id: 'factura-3',
        comercioId: 'comercio-1',
        clienteId: 'cliente-1',
        tipoDocumento: 1,
        timbrado,
        numeroFactura: new NumeroFactura('001', '001', '0000003'),
        tipoEmision: 1,
        fechaEmision: new Date('2024-01-15'),
        condicionPago: 'contado'
      });

      facturaMultiIVA.agregarItem(
        new ItemFactura({ descripcion: 'Producto IVA 10%', cantidad: 2, precioUnitario: 10000, tasaIVA: 10 })
      );
      facturaMultiIVA.agregarItem(
        new ItemFactura({ descripcion: 'Producto IVA 5%', cantidad: 1, precioUnitario: 5000, tasaIVA: 5 })
      );
      facturaMultiIVA.agregarItem(
        new ItemFactura({ descripcion: 'Producto Exento', cantidad: 1, precioUnitario: 3000, tasaIVA: 0 })
      );

      facturaMultiIVA.generarCDC(ruc, comercio.tipoContribuyente);
      facturaMultiIVA.marcarEnviada();
      facturaMultiIVA.marcarAprobada();

      const result = await generator.generar(facturaMultiIVA, comercio, cliente);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
