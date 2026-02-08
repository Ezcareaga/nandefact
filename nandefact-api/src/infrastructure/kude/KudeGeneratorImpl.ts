import PDFDocument from 'pdfkit';
import type { IKudeGenerator } from '../../domain/factura/IKudeGenerator.js';
import type { Factura } from '../../domain/factura/Factura.js';
import type { Comercio } from '../../domain/comercio/Comercio.js';
import type { Cliente } from '../../domain/cliente/Cliente.js';
import type { QrGeneratorSifen } from './QrGeneratorSifen.js';
import { CDCSinGenerarError } from '../../domain/errors/CDCSinGenerarError.js';

/**
 * Adaptador — Genera KuDE (PDF) con campos obligatorios SIFEN.
 * Implementación simplificada usando PDFKit (no requiere Java como facturacionelectronicapy-kude).
 *
 * Campos obligatorios según Manual Técnico SIFEN:
 * - RUC, razón social, nombre fantasía
 * - Timbrado, establecimiento, punto expedición, número
 * - Fecha emisión, CDC
 * - Items (código, descripción, cantidad, precio, subtotal)
 * - Totales (gravado 10%, gravado 5%, exento, IVA 10%, IVA 5%, total general)
 * - QR code
 * - URL verificación e-Kuatia
 */
export class KudeGeneratorImpl implements IKudeGenerator {
  private qrGenerator: QrGeneratorSifen;
  private cscId: string;
  private csc: string;
  private environment: 'test' | 'production';

  constructor(config: {
    qrGenerator: QrGeneratorSifen;
    cscId: string;
    csc: string;
    environment: 'test' | 'production';
  }) {
    this.qrGenerator = config.qrGenerator;
    this.cscId = config.cscId;
    this.csc = config.csc;
    this.environment = config.environment;
  }

  async generar(factura: Factura, comercio: Comercio, cliente: Cliente): Promise<Buffer> {
    if (!factura.cdc) {
      throw new CDCSinGenerarError(factura.id);
    }

    // Generar QR usando xmlgen + qrgen
    // NOTA: En producción real, el XML firmado debería venir de un repositorio o ser pasado como parámetro.
    // Por ahora, generamos un XML mínimo solo para obtener el QR.
    const xmlFirmado = this.generarXmlMinimo(factura, comercio, cliente);
    const xmlConQr = await this.qrGenerator.generarQr({
      xmlFirmado,
      cscId: this.cscId,
      csc: this.csc,
      environment: this.environment
    });
    const qrUrl = this.qrGenerator.extractQrUrl(xmlConQr);

    // Crear PDF
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    // Encabezado - Datos del emisor
    doc.fontSize(16).text('FACTURA ELECTRÓNICA', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`RUC: ${comercio.ruc.value}`, { align: 'center' });
    doc.text(comercio.razonSocial, { align: 'center' });
    if (comercio.nombreFantasia) {
      doc.text(comercio.nombreFantasia, { align: 'center' });
    }
    doc.moveDown(0.5);

    // Timbrado y numeración
    doc.fontSize(9);
    doc.text(`Timbrado: ${comercio.timbrado.numero}`);
    const vigenciaInicio = comercio.timbrado.fechaInicio.toISOString().split('T')[0] ?? '';
    const vigenciaFin = comercio.timbrado.fechaFin.toISOString().split('T')[0] ?? '';
    doc.text(`Vigencia: ${vigenciaInicio} - ${vigenciaFin}`);
    doc.text(`Establecimiento: ${factura.numeroFactura.establecimiento} | Punto Expedición: ${factura.numeroFactura.punto} | Nro: ${factura.numeroFactura.numero}`);
    const fechaEmision = factura.fechaEmision.toISOString().split('T')[0] ?? '';
    doc.text(`Fecha emisión: ${fechaEmision}`);
    doc.moveDown(0.5);

    // CDC
    doc.fontSize(8);
    doc.text(`CDC: ${factura.cdc.value}`, { align: 'left' });
    doc.moveDown(1);

    // Cliente
    doc.fontSize(10).text('RECEPTOR:', { underline: true });
    doc.fontSize(9);
    doc.text(`Nombre: ${cliente.nombre}`);
    if (cliente.rucCi) {
      doc.text(`${cliente.tipoDocumento}: ${cliente.rucCi}`);
    }
    doc.moveDown(1);

    // Ítems - Tabla
    doc.fontSize(9).text('ITEMS:', { underline: true });
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const colWidths = { cant: 50, desc: 200, precio: 80, subtotal: 80 };

    // Encabezado tabla
    doc.fontSize(8);
    doc.text('Cant.', 50, tableTop, { width: colWidths.cant, continued: true });
    doc.text('Descripción', { width: colWidths.desc, continued: true });
    doc.text('Precio Unit.', { width: colWidths.precio, align: 'right', continued: true });
    doc.text('Subtotal', { width: colWidths.subtotal, align: 'right' });

    let yPosition = tableTop + 15;

    // Ítems
    for (const item of factura.items) {
      doc.text(item.cantidad.toString(), 50, yPosition, { width: colWidths.cant, continued: true });
      doc.text(item.descripcion, { width: colWidths.desc, continued: true });
      doc.text(`Gs ${item.precioUnitario.toLocaleString('es-PY')}`, { width: colWidths.precio, align: 'right', continued: true });
      doc.text(`Gs ${item.subtotal.toLocaleString('es-PY')}`, { width: colWidths.subtotal, align: 'right' });
      yPosition += 20;
    }

    doc.moveDown(2);

    // Totales (Factura usa totalBruto, totalIVA10, totalIVA5, totalExenta, totalIVA)
    const totalesX = 350;
    doc.fontSize(9);

    // Calcular base gravada 10% (total bruto menos IVA)
    const totalGravada10 = factura.totalIVA10 > 0
      ? Math.round(factura.totalIVA10 / 0.1)
      : 0;
    const totalGravada5 = factura.totalIVA5 > 0
      ? Math.round(factura.totalIVA5 / 0.05)
      : 0;

    doc.text(`Gravado 10%: Gs ${totalGravada10.toLocaleString('es-PY')}`, totalesX, doc.y);
    doc.text(`IVA 10%: Gs ${factura.totalIVA10.toLocaleString('es-PY')}`, totalesX);
    doc.text(`Gravado 5%: Gs ${totalGravada5.toLocaleString('es-PY')}`, totalesX);
    doc.text(`IVA 5%: Gs ${factura.totalIVA5.toLocaleString('es-PY')}`, totalesX);
    doc.text(`Exenta: Gs ${factura.totalExenta.toLocaleString('es-PY')}`, totalesX);
    doc.moveDown(0.5);
    doc.fontSize(11).text(`TOTAL: Gs ${factura.totalBruto.toLocaleString('es-PY')}`, totalesX, doc.y, { underline: true });

    doc.moveDown(2);

    // QR y URL de verificación
    doc.fontSize(8);
    doc.text('Verificar en:', { align: 'center' });
    doc.fontSize(7).text(qrUrl, { align: 'center', link: qrUrl });

    doc.moveDown(1);
    doc.fontSize(7).text('Documento electrónico válido según Ley 6380/2019', { align: 'center' });

    // Finalizar PDF
    doc.end();

    // Esperar a que se complete la generación
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });
  }

  /**
   * Genera un XML mínimo del DE para poder generar el QR.
   * En producción real, esto debería usar XmlGeneratorSifen y XmlSignerSifen,
   * pero para la generación del KuDE necesitamos solo el QR.
   */
  private generarXmlMinimo(factura: Factura, comercio: Comercio, cliente: Cliente): string {
    // Usar XmlGeneratorSifen para generar el XML completo
    // Pero esto requiere inyectar IXmlGenerator... Para simplificar el MVP,
    // generamos un XML stub que qrgen pueda procesar.
    // TODO: En fase siguiente, inyectar IXmlGenerator y IXmlSigner para usar el XML real firmado.

    const totalIVA = factura.totalIVA10 + factura.totalIVA5;
    const cdcValue = factura.cdc?.value ?? '';

    const xmlStub = `<?xml version="1.0" encoding="UTF-8"?>
<rDE xmlns="http://ekuatia.set.gov.py/sifen/xsd">
  <DE>
    <dVerFor>150</dVerFor>
    <gTimb>
      <iTiDE>1</iTiDE>
      <dNumTim>${comercio.timbrado.numero}</dNumTim>
      <dEst>${factura.numeroFactura.establecimiento}</dEst>
      <dPunExp>${factura.numeroFactura.punto}</dPunExp>
      <dNumDoc>${factura.numeroFactura.numero}</dNumDoc>
      <dFeEmDE>${factura.fechaEmision.toISOString()}</dFeEmDE>
    </gTimb>
    <gDatGralOpe>
      <gEmis>
        <dRucEm>${comercio.ruc.value}</dRucEm>
        <dNomEmi>${comercio.razonSocial}</dNomEmi>
      </gEmis>
      <gDatRec>
        <dNomRec>${cliente.nombre}</dNomRec>
        <dRucRec>${cliente.rucCi || '0'}</dRucRec>
      </gDatRec>
    </gDatGralOpe>
    <gTotSub>
      <dTotGralOpe>${factura.totalBruto.toString()}</dTotGralOpe>
      <dTotIVA>${totalIVA.toString()}</dTotIVA>
    </gTotSub>
  </DE>
  <dId>${cdcValue}</dId>
</rDE>`;

    return xmlStub;
  }
}
