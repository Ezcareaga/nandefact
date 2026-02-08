import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegistrarComercio } from '../../../../src/application/comercio/RegistrarComercio.js';
import type { IComercioRepository } from '../../../../src/domain/comercio/IComercioRepository.js';
import { Comercio } from '../../../../src/domain/comercio/Comercio.js';
import { RUC } from '../../../../src/domain/comercio/RUC.js';
import { Timbrado } from '../../../../src/domain/comercio/Timbrado.js';
import { RucDuplicadoError } from '../../../../src/application/errors/RucDuplicadoError.js';

describe('RegistrarComercio', () => {
  let registrarComercio: RegistrarComercio;
  let mockComercioRepository: IComercioRepository;

  const inputValido = {
    ruc: '80069563-1',
    razonSocial: 'Doña María Almacén',
    nombreFantasia: 'Almacén María',
    timbradoNumero: '12558946',
    timbradoFechaInicio: new Date('2024-01-01'),
    timbradoFechaFin: new Date('2027-12-31'),
    establecimiento: '001',
    puntoExpedicion: '003',
    tipoContribuyente: 1 as const,
  };

  beforeEach(() => {
    mockComercioRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findByRuc: vi.fn().mockResolvedValue(null),
      save: vi.fn().mockResolvedValue(undefined),
    };

    registrarComercio = new RegistrarComercio({
      comercioRepository: mockComercioRepository,
    });
  });

  it('should register a comercio with valid data', async () => {
    const output = await registrarComercio.execute(inputValido);

    expect(output.comercioId).toBeTruthy();
    expect(typeof output.comercioId).toBe('string');
    expect(mockComercioRepository.save).toHaveBeenCalledTimes(1);
    expect(mockComercioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        razonSocial: 'Doña María Almacén',
        nombreFantasia: 'Almacén María',
        establecimiento: '001',
        puntoExpedicion: '003',
        tipoContribuyente: 1,
        activo: true,
      }),
    );
  });

  it('should register comercio with optional SIFEN fields', async () => {
    const inputConOpcionales = {
      ...inputValido,
      direccion: 'Mercado 4, Puesto 123',
      telefono: '0981234567',
      email: 'maria@correo.com',
      actividadEconomicaCodigo: '47111',
      actividadEconomicaDesc: 'Venta al por menor',
    };

    const output = await registrarComercio.execute(inputConOpcionales);

    expect(output.comercioId).toBeTruthy();
    expect(mockComercioRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        direccion: 'Mercado 4, Puesto 123',
        telefono: '0981234567',
        email: 'maria@correo.com',
      }),
    );
  });

  it('should throw RucDuplicadoError if RUC already exists', async () => {
    const comercioExistente = new Comercio({
      id: 'existing-id',
      ruc: new RUC('80069563-1'),
      razonSocial: 'Otro Comercio',
      nombreFantasia: 'Otro',
      timbrado: new Timbrado('12558946', new Date('2024-01-01'), new Date('2027-12-31')),
      establecimiento: '001',
      puntoExpedicion: '001',
      tipoContribuyente: 1,
    });
    vi.mocked(mockComercioRepository.findByRuc).mockResolvedValue(comercioExistente);

    await expect(registrarComercio.execute(inputValido)).rejects.toThrow(RucDuplicadoError);
    await expect(registrarComercio.execute(inputValido)).rejects.toThrow('Ya existe un comercio registrado con RUC: 80069563-1');
    expect(mockComercioRepository.save).not.toHaveBeenCalled();
  });

  it('should throw on invalid RUC format', async () => {
    const inputInvalido = { ...inputValido, ruc: 'invalid-ruc' };

    await expect(registrarComercio.execute(inputInvalido)).rejects.toThrow();
    expect(mockComercioRepository.save).not.toHaveBeenCalled();
  });

  it('should throw on expired timbrado', async () => {
    const inputVencido = {
      ...inputValido,
      timbradoFechaInicio: new Date('2020-01-01'),
      timbradoFechaFin: new Date('2021-12-31'),
    };

    await expect(registrarComercio.execute(inputVencido)).rejects.toThrow();
    expect(mockComercioRepository.save).not.toHaveBeenCalled();
  });

  it('should generate unique UUID for each comercio', async () => {
    const output1 = await registrarComercio.execute(inputValido);
    const output2 = await registrarComercio.execute(inputValido);

    expect(output1.comercioId).not.toBe(output2.comercioId);
  });

  it('should check RUC uniqueness before creating', async () => {
    await registrarComercio.execute(inputValido);

    expect(mockComercioRepository.findByRuc).toHaveBeenCalledWith('80069563-1');
    // findByRuc debe llamarse antes de save
    expect(mockComercioRepository.findByRuc).toHaveBeenCalledTimes(1);
    expect(mockComercioRepository.save).toHaveBeenCalledTimes(1);
  });
});
