import { describe, it, expect } from 'vitest';
import { mapComercioToParams, mapFacturaToData, mapItemsToSifenItems } from '../../../../src/infrastructure/sifen/SifenDataMapper.js';
import { Factura } from '../../../../src/domain/factura/Factura.js';
import { ItemFactura } from '../../../../src/domain/factura/ItemFactura.js';
import { NumeroFactura } from '../../../../src/domain/factura/NumeroFactura.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { Cliente } from '../../../../src/domain/cliente/Cliente.js';

describe('SifenDataMapper', () => {
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

  const clienteRUCMock = new Cliente({
    id: 'cli-1',
    comercioId: 'com-1',
    nombre: 'Juan Pérez',
    rucCi: '5432109-8',
    tipoDocumento: 'RUC',
    telefono: '0981123456',
    email: 'juan@example.com',
  });

  const clienteCIMock = new Cliente({
    id: 'cli-2',
    comercioId: 'com-1',
    nombre: 'Ana López',
    rucCi: '1234567',
    tipoDocumento: 'CI',
  });

  const clientePasaporteMock = new Cliente({
    id: 'cli-3',
    comercioId: 'com-1',
    nombre: 'John Smith',
    rucCi: 'AB123456',
    tipoDocumento: 'pasaporte',
  });

  const clienteInnominadoMock = new Cliente({
    id: 'cli-4',
    comercioId: 'com-1',
    nombre: 'Consumidor Final',
    rucCi: '',
    tipoDocumento: 'innominado',
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

    factura.agregarItem(
      new ItemFactura({
        descripcion: 'Tomate',
        cantidad: 2,
        precioUnitario: 8000,
        tasaIVA: 10,
      }),
    );

    factura.generarCDC(comercioMock.ruc, comercioMock.tipoContribuyente);

    return factura;
  };

  describe('mapComercioToParams', () => {
    it('debe mapear version a 150', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.version).toBe(150);
    });

    it('debe mapear RUC completo con DV', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.ruc).toBe('80069563-1');
    });

    it('debe mapear razonSocial', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.razonSocial).toBe('María Mercado SRL');
    });

    it('debe mapear nombreFantasia', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.nombreFantasia).toBe('Verdulería Doña María');
    });

    it('debe mapear timbradoNumero', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.timbradoNumero).toBe('12345678');
    });

    it('debe mapear timbradoFecha como YYYY-MM-DD', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.timbradoFecha).toBe('2024-01-01');
    });

    it('debe mapear tipoContribuyente (1=PF)', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.tipoContribuyente).toBe(1);
    });

    it('debe mapear tipoRegimen a 8 (hardcoded)', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.tipoRegimen).toBe(8);
    });

    it('debe incluir actividadesEconomicas con codigo 47190', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.actividadesEconomicas).toHaveLength(1);
      expect(params.actividadesEconomicas[0]?.codigo).toBe('47190');
    });

    it('debe incluir establecimientos con codigo del comercio', () => {
      const params = mapComercioToParams(comercioMock);
      expect(params.establecimientos).toHaveLength(1);
      expect(params.establecimientos[0]?.codigo).toBe('001');
    });
  });

  describe('mapFacturaToData', () => {
    it('debe mapear tipoDocumento (1=FE)', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.tipoDocumento).toBe(1);
    });

    it('debe mapear establecimiento', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.establecimiento).toBe('001');
    });

    it('debe mapear punto', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.punto).toBe('003');
    });

    it('debe mapear numero', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.numero).toBe('0000137');
    });

    it('debe mapear codigoSeguridadAleatorio desde CDC (9 digitos)', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.codigoSeguridadAleatorio).toHaveLength(9);
      expect(/^\d{9}$/.test(data.codigoSeguridadAleatorio)).toBe(true);
    });

    it('debe mapear fecha como ISO8601 YYYY-MM-DDThh:mm:ss', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.fecha).toBe('2024-06-15T10:30:00');
    });

    it('debe mapear tipoEmision (1=Normal)', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.tipoEmision).toBe(1);
    });

    it('debe mapear tipoTransaccion a 1 (venta)', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.tipoTransaccion).toBe(1);
    });

    it('debe mapear condicion.tipo: contado=1', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.condicion.tipo).toBe(1);
    });

    it('debe mapear condicion.tipo: credito=2', () => {
      const factura = new Factura({
        id: 'fac-2',
        comercioId: 'com-1',
        clienteId: 'cli-1',
        tipoDocumento: 1,
        timbrado: comercioMock.timbrado,
        numeroFactura: new NumeroFactura('001', '003', '0000138'),
        tipoEmision: 1,
        condicionPago: 'credito',
        fechaEmision: new Date('2024-06-15T10:30:00Z'),
      });
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.condicion.tipo).toBe(2);
    });

    it('debe mapear credito con tipo=1 y plazo="A convenir" (Grupo F2)', () => {
      const factura = new Factura({
        id: 'fac-cred',
        comercioId: 'com-1',
        clienteId: 'cli-1',
        tipoDocumento: 1,
        timbrado: comercioMock.timbrado,
        numeroFactura: new NumeroFactura('001', '003', '0000139'),
        tipoEmision: 1,
        condicionPago: 'credito',
        fechaEmision: new Date('2024-06-15T10:30:00Z'),
      });
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.condicion.credito).toEqual({
        tipo: 1,
        plazo: 'A convenir',
      });
    });

    it('debe NO incluir entregas cuando condicion es credito', () => {
      const factura = new Factura({
        id: 'fac-cred-2',
        comercioId: 'com-1',
        clienteId: 'cli-1',
        tipoDocumento: 1,
        timbrado: comercioMock.timbrado,
        numeroFactura: new NumeroFactura('001', '003', '0000140'),
        tipoEmision: 1,
        condicionPago: 'credito',
        fechaEmision: new Date('2024-06-15T10:30:00Z'),
      });
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.condicion.entregas).toBeUndefined();
    });

    it('debe incluir entregas con monto total cuando condicion es contado', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.condicion.entregas).toBeDefined();
      expect(data.condicion.entregas).toHaveLength(1);
      expect(data.condicion.entregas![0]?.tipo).toBe(1);
      expect(data.condicion.entregas![0]?.moneda).toBe('PYG');
      expect(data.condicion.credito).toBeUndefined();
    });

    it('debe mapear moneda a "PYG"', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.moneda).toBe('PYG');
    });

    it('debe mapear cliente con RUC: contribuyente=true', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.cliente.contribuyente).toBe(true);
      expect(data.cliente.ruc).toBe('5432109-8');
      expect(data.cliente.razonSocial).toBe('Juan Pérez');
    });

    it('debe mapear cliente con CI: contribuyente=false, documentoTipo=1', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteCIMock);
      expect(data.cliente.contribuyente).toBe(false);
      expect(data.cliente.documentoTipo).toBe(1);
      expect(data.cliente.documentoNumero).toBe('1234567');
      expect(data.cliente.razonSocial).toBe('Ana López');
    });

    it('debe mapear cliente con pasaporte: documentoTipo=2', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clientePasaporteMock);
      expect(data.cliente.contribuyente).toBe(false);
      expect(data.cliente.documentoTipo).toBe(2);
      expect(data.cliente.documentoNumero).toBe('AB123456');
    });

    it('debe mapear cliente innominado: documentoTipo=5', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteInnominadoMock);
      expect(data.cliente.contribuyente).toBe(false);
      expect(data.cliente.documentoTipo).toBe(5);
      expect(data.cliente.razonSocial).toBe('Consumidor Final');
    });

    it('debe incluir items mapeados', () => {
      const factura = crearFacturaMock();
      const data = mapFacturaToData(factura, comercioMock, clienteRUCMock);
      expect(data.items).toHaveLength(2);
    });
  });

  describe('mapItemsToSifenItems', () => {
    it('debe mapear codigo secuencial comenzando en 1', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      expect(items[0]?.codigo).toBe('1');
      expect(items[1]?.codigo).toBe('2');
    });

    it('debe mapear descripcion', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      expect(items[0]?.descripcion).toBe('Mandioca');
      expect(items[1]?.descripcion).toBe('Tomate');
    });

    it('debe mapear unidadMedida a 77 (unidad)', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      expect(items[0]?.unidadMedida).toBe(77);
    });

    it('debe mapear cantidad', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      expect(items[0]?.cantidad).toBe(3);
      expect(items[1]?.cantidad).toBe(2);
    });

    it('debe mapear precioUnitario como base sin IVA', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      // Mandioca: 15000 total / 1.05 = 14286 base, / 3 unidades = 4762 por unidad
      expect(items[0]?.precioUnitario).toBe(4762);
      // Tomate: 16000 total / 1.10 = 14545 base, / 2 unidades = 7273 por unidad (rounded)
      expect(items[1]?.precioUnitario).toBe(7273);
    });

    it('debe mapear ivaTipo=1 para IVA 10%', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      expect(items[1]?.ivaTipo).toBe(1); // Tomate 10%
    });

    it('debe mapear ivaTipo=1 para IVA 5%', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      expect(items[0]?.ivaTipo).toBe(1); // Mandioca 5%
    });

    it('debe mapear ivaTipo=3 para exenta', () => {
      const factura = new Factura({
        id: 'fac-ex',
        comercioId: 'com-1',
        clienteId: 'cli-1',
        tipoDocumento: 1,
        timbrado: comercioMock.timbrado,
        numeroFactura: new NumeroFactura('001', '003', '0000200'),
        tipoEmision: 1,
        condicionPago: 'contado',
        fechaEmision: new Date('2024-06-15T10:30:00Z'),
      });

      factura.agregarItem(
        new ItemFactura({
          descripcion: 'Producto Exento',
          cantidad: 1,
          precioUnitario: 10000,
          tasaIVA: 0,
        }),
      );

      const items = mapItemsToSifenItems(factura.items);
      expect(items[0]?.ivaTipo).toBe(3); // Exenta
    });

    it('debe mapear iva (tasa IVA: 10, 5, 0)', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      expect(items[0]?.iva).toBe(5);
      expect(items[1]?.iva).toBe(10);
    });

    it('debe mapear ivaProporcion=100 (proporcion 100%)', () => {
      const factura = crearFacturaMock();
      const items = mapItemsToSifenItems(factura.items);
      expect(items[0]?.ivaProporcion).toBe(100);
      expect(items[1]?.ivaProporcion).toBe(100);
    });
  });
});
