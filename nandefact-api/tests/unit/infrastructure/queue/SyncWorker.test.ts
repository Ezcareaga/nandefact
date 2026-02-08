import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { SyncWorker } from '../../../../src/infrastructure/queue/SyncWorker.js';
import type { ProcesarColaSifen } from '../../../../src/application/sync/ProcesarColaSifen.js';
import type { ILogger } from '../../../../src/domain/shared/ILogger.js';

// Mock BullMQ Worker
let mockProcessor: ((job: { data: Record<string, unknown> }) => Promise<unknown>) | null = null;
let mockEventHandlers: Record<string, ((job?: unknown, err?: Error) => void)[]> = {};

vi.mock('bullmq', () => ({
  Worker: vi.fn().mockImplementation((queueName: string, processor: (job: { data: Record<string, unknown> }) => Promise<unknown>, opts: unknown) => {
    mockProcessor = processor;
    mockEventHandlers = {};
    return {
      on: vi.fn((event: string, handler: (job?: unknown, err?: Error) => void) => {
        if (!mockEventHandlers[event]) mockEventHandlers[event] = [];
        mockEventHandlers[event].push(handler);
      }),
      close: vi.fn(async () => {}),
    };
  }),
  Queue: vi.fn(), // Already mocked in SyncQueueBullMQ tests
}));

describe('SyncWorker', () => {
  let worker: SyncWorker;
  let mockProcesarColaSifen: {
    execute: Mock<[{ job: unknown }], Promise<{ exito: boolean; facturaId: string; cdc: string; error?: string }>>;
  };
  let mockLogger: ILogger;

  beforeEach(() => {
    vi.clearAllMocks();
    mockProcessor = null;
    mockEventHandlers = {};

    mockProcesarColaSifen = {
      execute: vi.fn(async ({ job }) => ({
        exito: true,
        facturaId: (job as any).facturaId,
        cdc: (job as any).cdc,
      })),
    };

    mockLogger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    worker = new SyncWorker({
      procesarColaSifen: mockProcesarColaSifen as unknown as ProcesarColaSifen,
      logger: mockLogger,
      redisConnection: { host: 'localhost', port: 6379 },
    });
  });

  it('should create worker with correct queue name and concurrency=1', async () => {
    worker.start();

    const { Worker: WorkerMock } = await import('bullmq');
    expect(WorkerMock).toHaveBeenCalledWith(
      'sifen-sync',
      expect.any(Function),
      expect.objectContaining({
        connection: { host: 'localhost', port: 6379 },
        concurrency: 1,
        limiter: { max: 10, duration: 60000 },
      }),
    );
  });

  it('should deserialize job data into SyncJob correctly', async () => {
    worker.start();

    const jobData = {
      id: 'job-1',
      comercioId: 'com-1',
      facturaId: 'fac-1',
      cdc: '01234567890123456789012345678901234567890123',
      fechaEmision: '2026-02-07T12:00:00.000Z',
      intentos: 0,
      maxIntentos: 5,
      creadoEn: '2026-02-07T12:00:00.000Z',
    };

    await mockProcessor!({ data: jobData });

    expect(mockProcesarColaSifen.execute).toHaveBeenCalledTimes(1);
    const callArg = mockProcesarColaSifen.execute.mock.calls[0][0].job;

    expect(callArg).toMatchObject({
      id: 'job-1',
      comercioId: 'com-1',
      facturaId: 'fac-1',
      cdc: '01234567890123456789012345678901234567890123',
      intentos: 0,
      maxIntentos: 5,
    });
    expect(callArg.fechaEmision).toBeInstanceOf(Date);
    expect(callArg.creadoEn).toBeInstanceOf(Date);
  });

  it('should call ProcesarColaSifen.execute with deserialized SyncJob', async () => {
    worker.start();

    const jobData = {
      id: 'job-2',
      comercioId: 'com-2',
      facturaId: 'fac-2',
      cdc: '01234567890123456789012345678901234567890124',
      fechaEmision: '2026-02-07T15:00:00.000Z',
      intentos: 1,
      maxIntentos: 5,
      ultimoError: 'Previous error',
      creadoEn: '2026-02-07T14:00:00.000Z',
    };

    await mockProcessor!({ data: jobData });

    expect(mockProcesarColaSifen.execute).toHaveBeenCalledTimes(1);
    expect(mockProcesarColaSifen.execute.mock.calls[0][0].job).toMatchObject({
      id: 'job-2',
      comercioId: 'com-2',
      intentos: 1,
      ultimoError: 'Previous error',
    });
  });

  it('should log job start and completion with comercioId and CDC', async () => {
    worker.start();

    const jobData = {
      id: 'job-3',
      comercioId: 'com-3',
      facturaId: 'fac-3',
      cdc: '01234567890123456789012345678901234567890125',
      fechaEmision: '2026-02-07T12:00:00.000Z',
      intentos: 2,
      maxIntentos: 5,
      creadoEn: '2026-02-07T12:00:00.000Z',
    };

    await mockProcessor!({ data: jobData });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Worker recibió job',
      expect.objectContaining({
        jobId: 'job-3',
        comercioId: 'com-3',
        cdc: '01234567890123456789012345678901234567890125',
        intento: 3, // intentos + 1
      }),
    );

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Worker completó job',
      expect.objectContaining({
        jobId: 'job-3',
        comercioId: 'com-3',
        cdc: '01234567890123456789012345678901234567890125',
        exito: true,
      }),
    );
  });

  it('should log on worker start with queue name and concurrency', () => {
    worker.start();

    expect(mockLogger.info).toHaveBeenCalledWith(
      'SyncWorker iniciado',
      expect.objectContaining({
        queue: 'sifen-sync',
        concurrency: 1,
      }),
    );
  });

  it('should close worker on stop()', async () => {
    worker.start();
    expect(worker.isRunning()).toBe(true);

    await worker.stop();

    expect(worker.isRunning()).toBe(false);
    expect(mockLogger.info).toHaveBeenCalledWith('SyncWorker detenido');
  });

  it('should report isRunning() correctly', () => {
    expect(worker.isRunning()).toBe(false);

    worker.start();
    expect(worker.isRunning()).toBe(true);
  });

  it('should handle errors in job processing', async () => {
    mockProcesarColaSifen.execute = vi.fn(async () => ({
      exito: false,
      facturaId: 'fac-4',
      cdc: '01234567890123456789012345678901234567890126',
      error: 'Network timeout',
    }));

    worker = new SyncWorker({
      procesarColaSifen: mockProcesarColaSifen as unknown as ProcesarColaSifen,
      logger: mockLogger,
      redisConnection: { host: 'localhost', port: 6379 },
    });

    worker.start();

    const jobData = {
      id: 'job-4',
      comercioId: 'com-4',
      facturaId: 'fac-4',
      cdc: '01234567890123456789012345678901234567890126',
      fechaEmision: '2026-02-07T12:00:00.000Z',
      intentos: 0,
      maxIntentos: 5,
      creadoEn: '2026-02-07T12:00:00.000Z',
    };

    await mockProcessor!({ data: jobData });

    expect(mockLogger.info).toHaveBeenCalledWith(
      'Worker completó job',
      expect.objectContaining({
        exito: false,
        error: 'Network timeout',
      }),
    );
  });
});
