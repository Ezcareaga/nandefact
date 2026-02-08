import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificadorStub } from '../../../../src/infrastructure/notificador/NotificadorStub.js';

describe('NotificadorStub', () => {
  let notificador: NotificadorStub;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    notificador = new NotificadorStub();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('debe loguear mensaje con telefono y tamaño del PDF', async () => {
    const telefono = '0981123456';
    const pdfBuffer = Buffer.from('fake-pdf-content-here');

    await notificador.enviarKuDE(telefono, pdfBuffer);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      `[NotificadorStub] KuDE enviado a ${telefono} (${pdfBuffer.length} bytes)`
    );
  });

  it('no debe lanzar error', async () => {
    const telefono = '0981999888';
    const pdfBuffer = Buffer.from('test');

    await expect(notificador.enviarKuDE(telefono, pdfBuffer)).resolves.not.toThrow();
  });

  it('debe loguear tamaño correcto del buffer', async () => {
    const pdfBuffer = Buffer.alloc(1024); // 1KB buffer

    await notificador.enviarKuDE('0981555444', pdfBuffer);

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('1024 bytes')
    );
  });
});
