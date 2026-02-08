import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CargarCertificado } from '../../../../src/application/comercio/CargarCertificado.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import type { ICertificadoStore } from '../../../../src/domain/comercio/ICertificadoStore.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { ComercioNoEncontradoError } from '../../../../src/application/errors/ComercioNoEncontradoError.js';
import { ApplicationError } from '../../../../src/application/errors/ApplicationError.js';

describe('CargarCertificado', () => {
  let cargarCertificado: CargarCertificado;
  let mockComercioRepository: IComercioRepository;
  let mockCertificadoStore: ICertificadoStore;
  let comercioValido: Comercio;

  beforeEach(() => {
    comercioValido = new Comercio({
      id: 'comercio-uuid',
      ruc: new RUC('80069563-1'),
      razonSocial: 'Doña María Almacén',
      nombreFantasia: 'Almacén María',
      timbrado: new Timbrado('12558946', new Date('2024-01-01'), new Date('2027-12-31')),
      establecimiento: '001',
      puntoExpedicion: '003',
      tipoContribuyente: 1,
    });

    mockComercioRepository = {
      findById: vi.fn().mockResolvedValue(comercioValido),
      findByRuc: vi.fn(),
      save: vi.fn(),
    };

    mockCertificadoStore = {
      guardar: vi.fn().mockResolvedValue(undefined),
      recuperar: vi.fn(),
      existe: vi.fn(),
    };

    cargarCertificado = new CargarCertificado({
      comercioRepository: mockComercioRepository,
      certificadoStore: mockCertificadoStore,
    });
  });

  it('should store certificate for existing comercio', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      certificadoPkcs12: Buffer.from('fake-cert-data'),
      password: 'cert-password',
    };

    await cargarCertificado.execute(input);

    expect(mockCertificadoStore.guardar).toHaveBeenCalledWith(
      'comercio-uuid',
      input.certificadoPkcs12,
      'cert-password',
    );
  });

  it('should throw ComercioNoEncontradoError if comercio not found', async () => {
    vi.mocked(mockComercioRepository.findById).mockResolvedValue(null);

    const input = {
      comercioId: 'no-existe',
      certificadoPkcs12: Buffer.from('fake-cert-data'),
      password: 'cert-password',
    };

    await expect(cargarCertificado.execute(input)).rejects.toThrow(ComercioNoEncontradoError);
    expect(mockCertificadoStore.guardar).not.toHaveBeenCalled();
  });

  it('should throw ApplicationError if certificate is empty', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      certificadoPkcs12: Buffer.alloc(0),
      password: 'cert-password',
    };

    await expect(cargarCertificado.execute(input)).rejects.toThrow(ApplicationError);
    await expect(cargarCertificado.execute(input)).rejects.toThrow('El certificado no puede estar vacío');
    expect(mockCertificadoStore.guardar).not.toHaveBeenCalled();
  });

  it('should throw ApplicationError if password is empty', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      certificadoPkcs12: Buffer.from('fake-cert-data'),
      password: '',
    };

    await expect(cargarCertificado.execute(input)).rejects.toThrow(ApplicationError);
    await expect(cargarCertificado.execute(input)).rejects.toThrow('La contraseña del certificado no puede estar vacía');
    expect(mockCertificadoStore.guardar).not.toHaveBeenCalled();
  });

  it('should throw ApplicationError if password is only whitespace', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      certificadoPkcs12: Buffer.from('fake-cert-data'),
      password: '   ',
    };

    await expect(cargarCertificado.execute(input)).rejects.toThrow(ApplicationError);
    expect(mockCertificadoStore.guardar).not.toHaveBeenCalled();
  });
});
