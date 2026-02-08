import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigurarTimbrado } from '../../../../src/application/comercio/ConfigurarTimbrado.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { ComercioNoEncontradoError } from '../../../../src/application/errors/ComercioNoEncontradoError.js';
import { DomainError } from '../../../../src/domain/errors/DomainError.js';

describe('ConfigurarTimbrado', () => {
  let configurarTimbrado: ConfigurarTimbrado;
  let mockComercioRepository: IComercioRepository;
  let comercioValido: Comercio;

  beforeEach(() => {
    comercioValido = new Comercio({
      id: 'comercio-uuid',
      ruc: new RUC('80069563-1'),
      razonSocial: 'Doña María Almacén',
      nombreFantasia: 'Almacén María',
      timbrado: new Timbrado('12558946', new Date('2024-01-01'), new Date('2025-12-31')),
      establecimiento: '001',
      puntoExpedicion: '003',
      tipoContribuyente: 1,
    });

    mockComercioRepository = {
      findById: vi.fn().mockResolvedValue(comercioValido),
      findByRuc: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };

    configurarTimbrado = new ConfigurarTimbrado({
      comercioRepository: mockComercioRepository,
    });
  });

  it('should update timbrado on existing comercio', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      timbradoNumero: '98765432',
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2027-12-31'),
    };

    await configurarTimbrado.execute(input);

    expect(mockComercioRepository.save).toHaveBeenCalledTimes(1);
    const savedComercio = vi.mocked(mockComercioRepository.save).mock.calls[0]![0]!;
    expect(savedComercio.timbrado.numero).toBe('98765432');
  });

  it('should throw ComercioNoEncontradoError if comercio not found', async () => {
    vi.mocked(mockComercioRepository.findById).mockResolvedValue(null);

    const input = {
      comercioId: 'no-existe',
      timbradoNumero: '98765432',
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2027-12-31'),
    };

    await expect(configurarTimbrado.execute(input)).rejects.toThrow(ComercioNoEncontradoError);
    expect(mockComercioRepository.save).not.toHaveBeenCalled();
  });

  it('should throw DomainError if new timbrado is expired', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      timbradoNumero: '98765432',
      fechaInicio: new Date('2020-01-01'),
      fechaFin: new Date('2021-12-31'),
    };

    await expect(configurarTimbrado.execute(input)).rejects.toThrow(DomainError);
    expect(mockComercioRepository.save).not.toHaveBeenCalled();
  });

  it('should save the updated comercio via repository', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      timbradoNumero: '99887766',
      fechaInicio: new Date('2025-01-01'),
      fechaFin: new Date('2028-06-01'),
    };

    await configurarTimbrado.execute(input);

    expect(mockComercioRepository.save).toHaveBeenCalledTimes(1);
    const savedComercio = vi.mocked(mockComercioRepository.save).mock.calls[0]![0]!;
    // El comercio actualizado mantiene su ID y RUC originales
    expect(savedComercio.id).toBe('comercio-uuid');
    expect(savedComercio.ruc.value).toBe('80069563-1');
    // Pero tiene el nuevo timbrado
    expect(savedComercio.timbrado.numero).toBe('99887766');
  });

  it('should throw on invalid timbrado number format', async () => {
    const input = {
      comercioId: 'comercio-uuid',
      timbradoNumero: 'abc',
      fechaInicio: new Date('2026-01-01'),
      fechaFin: new Date('2027-12-31'),
    };

    await expect(configurarTimbrado.execute(input)).rejects.toThrow();
    expect(mockComercioRepository.save).not.toHaveBeenCalled();
  });
});
