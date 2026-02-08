import { describe, it, expect } from 'vitest';
import { XmlGeneratorSifen } from '../../../../src/infrastructure/sifen/XmlGeneratorSifen.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';

describe('XmlGeneratorSifen', () => {
  // --- Fixtures ---
  const comercioMock = new Comercio({
    id: 'com-1',
    ruc: new RUC('80069563-1'),
    razonSocial: 'María Mercado SRL',
    nombreFantasia: 'Verdulería Doña María',
    timbrado: new Timbrado('12345678', new Date('2024-01-01'), new Date('2025-12-31')),
    establecimiento: '001',
    puntoExpedicion: '003',
    tipoContribuyente: 1,
  });

  const clienteMock = new Cliente({
    id: 'cli-1',
    comercioId: 'com-1',
    nombre: 'Juan Pérez',
    rucCi: '5432109-8',
    tipoDocumento: 'RUC',
    telefono: '0981123456',
    email: 'juan@example.com',
  });

  const crearFacturaMock = (): Factura => {
    const factura = new Factura({
      id: 'fac-1',
      comercioId: 'com-1',
      clienteId: 'cli-1',
      tipoDocumento: 1,
      timbrado: comercioMock.timbrado,
      numeroFactura: new NumeroFactura('001', '003', '0000137'),
      tipoEmision: 1,
      condicionPago: 'contado',
      fechaEmision: new Date('2024-06-15T10:30:00Z'),
    });

    factura.agregarItem(
      new ItemFactura({
        descripcion: 'Mandioca',
        cantidad: 3,
        precioUnitario: 5000,
        tasaIVA: 5,
      }),
    );

    factura.generarCDC(comercioMock.ruc, comercioMock.tipoContribuyente);

    return factura;
  };

  it('debe implementar IXmlGenerator', () => {
    const generator = new XmlGeneratorSifen();
    expect(generator.generarXml).toBeDefined();
  });

  it('debe lanzar error si factura no tiene CDC', async () => {
    const factura = new Factura({
      id: 'fac-1',
      comercioId: 'com-1',
      clienteId: 'cli-1',
      tipoDocumento: 1,
      timbrado: comercioMock.timbrado,
      numeroFactura: new NumeroFactura('001', '003', '0000137'),
      tipoEmision: 1,
      condicionPago: 'contado',
      fechaEmision: new Date('2024-06-15T10:30:00Z'),
    });

    factura.agregarItem(
      new ItemFactura({
        descripcion: 'Producto',
        cantidad: 1,
        precioUnitario: 1000,
        tasaIVA: 10,
      }),
    );

    const generator = new XmlGeneratorSifen();

    await expect(generator.generarXml(factura, comercioMock, clienteMock)).rejects.toThrow(
      'No se puede generar XML sin CDC',
    );
  });

  it('debe generar XML string valido', async () => {
    const factura = crearFacturaMock();
    const generator = new XmlGeneratorSifen();

    const xml = await generator.generarXml(factura, comercioMock, clienteMock);

    expect(typeof xml).toBe('string');
    expect(xml.length).toBeGreaterThan(100);
    expect(xml).toContain('<?xml');
  });

  it('debe incluir CDC en el XML generado', async () => {
    const factura = crearFacturaMock();
    const generator = new XmlGeneratorSifen();

    const xml = await generator.generarXml(factura, comercioMock, clienteMock);

    // xmlgen library regenera el CDC a partir de los datos
    // Verificamos que el XML contenga un CDC válido de 44 dígitos
    expect(xml).toMatch(/<DE Id="\d{44}">/);
    // Verificamos que contenga los componentes clave del CDC
    expect(xml).toContain('80069563'); // RUC
    expect(xml).toContain('001'); // Establecimiento
    expect(xml).toContain('003'); // Punto expedición
    expect(xml).toContain('0000137'); // Número
  });
});
