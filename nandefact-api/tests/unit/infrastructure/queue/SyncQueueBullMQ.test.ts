import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SyncQueueBullMQ } from '../../../../src/infrastructure/queue/SyncQueueBullMQ.js';
import { SyncJob } from '../../../../src/domain/sync/SyncJob.js';

// Mock BullMQ Queue
vi.mock('bullmq', () => {
  const mockJobs: Array<{ id: string; data: Record<string, unknown> }> = [];

  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn(async (name: string, data: Record<string, unknown>, opts?: { jobId?: string; delay?: number }) => {
        mockJobs.push({ id: opts?.jobId || 'mock-job-id', data });
        return { id: opts?.jobId || 'mock-job-id' };
      }),
      getJobs: vi.fn(async (types: string[]) => {
        return mockJobs.map((job) => ({
          id: job.id,
          data: job.data,
        }));
      }),
      close: vi.fn(async () => {}),
      // Expose mockJobs for test verification
      __mockJobs: mockJobs,
      __clearMockJobs: () => {
        mockJobs.length = 0;
      },
    })),
  };
});

describe('SyncQueueBullMQ', () => {
  let queue: SyncQueueBullMQ;

  beforeEach(() => {
    vi.clearAllMocks();
    queue = new SyncQueueBullMQ({ host: 'localhost', port: 6379 });
    // Clear mock jobs
    (queue as any).queue.__clearMockJobs();
  });

  it('should add job to queue when encolar is called', async () => {
    const job = new SyncJob({
      id: 'job-1',
      comercioId: 'com-1',
      facturaId: 'fac-1',
      cdc: '01234567890123456789012345678901234567890123',
      fechaEmision: new Date('2026-02-07T12:00:00Z'),
      intentos: 0,
      maxIntentos: 5,
      creadoEn: new Date('2026-02-07T12:00:00Z'),
    });

    await queue.encolar(job);

    const mockQueue = (queue as any).queue;
    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'procesar-factura',
      expect.objectContaining({
        id: 'job-1',
        comercioId: 'com-1',
        facturaId: 'fac-1',
        cdc: '01234567890123456789012345678901234567890123',
        fechaEmision: '2026-02-07T12:00:00.000Z',
        intentos: 0,
        maxIntentos: 5,
      }),
      { jobId: 'job-1' },
    );
  });

  it('should serialize and deserialize dates correctly', async () => {
    const fechaEmision = new Date('2026-02-07T15:30:00Z');
    const creadoEn = new Date('2026-02-07T15:00:00Z');

    const job = new SyncJob({
      id: 'job-2',
      comercioId: 'com-2',
      facturaId: 'fac-2',
      cdc: '01234567890123456789012345678901234567890124',
      fechaEmision,
      intentos: 0,
      maxIntentos: 5,
      creadoEn,
    });

    await queue.encolar(job);

    const desencolar = await queue.desencolar();
    expect(desencolar).not.toBeNull();
    expect(desencolar!.fechaEmision.toISOString()).toBe(fechaEmision.toISOString());
    expect(desencolar!.creadoEn.toISOString()).toBe(creadoEn.toISOString());
  });

  it('should calculate correct backoff delays', () => {
    expect(queue.calcularBackoff(1)).toBe(1000); // 2^0 * 1000
    expect(queue.calcularBackoff(2)).toBe(2000); // 2^1 * 1000
    expect(queue.calcularBackoff(3)).toBe(4000); // 2^2 * 1000
    expect(queue.calcularBackoff(4)).toBe(8000); // 2^3 * 1000
    expect(queue.calcularBackoff(5)).toBe(16000); // 2^4 * 1000
  });

  it('should re-enqueue with delay when fallar is called', async () => {
    const job = new SyncJob({
      id: 'job-3',
      comercioId: 'com-3',
      facturaId: 'fac-3',
      cdc: '01234567890123456789012345678901234567890125',
      fechaEmision: new Date('2026-02-07T12:00:00Z'),
      intentos: 1,
      maxIntentos: 5,
      creadoEn: new Date('2026-02-07T12:00:00Z'),
    });

    await queue.fallar(job, 'Network timeout');

    const mockQueue = (queue as any).queue;
    expect(mockQueue.add).toHaveBeenCalledTimes(1);
    expect(mockQueue.add).toHaveBeenCalledWith(
      'procesar-factura',
      expect.objectContaining({
        intentos: 2, // Incremented
        ultimoError: 'Network timeout',
      }),
      {
        delay: 2000, // calcularBackoff(2) = 2000ms
        jobId: 'job-3-retry-2',
      },
    );
  });

  it('should return null when desencolar is called on empty queue', async () => {
    const mockQueue = (queue as any).queue;
    mockQueue.getJobs = vi.fn(async () => []);

    const result = await queue.desencolar();
    expect(result).toBeNull();
  });

  it('should filter pendientes by comercioId', async () => {
    const job1 = new SyncJob({
      id: 'job-4',
      comercioId: 'com-4',
      facturaId: 'fac-4',
      cdc: '01234567890123456789012345678901234567890126',
      fechaEmision: new Date('2026-02-07T12:00:00Z'),
      intentos: 0,
      maxIntentos: 5,
      creadoEn: new Date('2026-02-07T12:00:00Z'),
    });

    const job2 = new SyncJob({
      id: 'job-5',
      comercioId: 'com-5',
      facturaId: 'fac-5',
      cdc: '01234567890123456789012345678901234567890127',
      fechaEmision: new Date('2026-02-07T12:00:00Z'),
      intentos: 0,
      maxIntentos: 5,
      creadoEn: new Date('2026-02-07T12:00:00Z'),
    });

    await queue.encolar(job1);
    await queue.encolar(job2);

    const pendientes = await queue.obtenerPendientes('com-4');
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].comercioId).toBe('com-4');
  });

  it('should count pendientes correctly', async () => {
    const job1 = new SyncJob({
      id: 'job-6',
      comercioId: 'com-6',
      facturaId: 'fac-6',
      cdc: '01234567890123456789012345678901234567890128',
      fechaEmision: new Date('2026-02-07T12:00:00Z'),
      intentos: 0,
      maxIntentos: 5,
      creadoEn: new Date('2026-02-07T12:00:00Z'),
    });

    const job2 = new SyncJob({
      id: 'job-7',
      comercioId: 'com-6',
      facturaId: 'fac-7',
      cdc: '01234567890123456789012345678901234567890129',
      fechaEmision: new Date('2026-02-07T12:00:00Z'),
      intentos: 0,
      maxIntentos: 5,
      creadoEn: new Date('2026-02-07T12:00:00Z'),
    });

    await queue.encolar(job1);
    await queue.encolar(job2);

    const count = await queue.contarPendientes('com-6');
    expect(count).toBe(2);
  });

  it('should close queue connection', async () => {
    await queue.close();

    const mockQueue = (queue as any).queue;
    expect(mockQueue.close).toHaveBeenCalledTimes(1);
  });
});
