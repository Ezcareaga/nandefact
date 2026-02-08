/** Entorno SIFEN */
export type SifenEnvironment = 'test' | 'prod';

/** Props de configuración SIFEN */
export interface SifenConfigProps {
  environment: SifenEnvironment;
  certificatePath: string;
  certificatePassword: string;
  privateKeyPath?: string;
}

/** Configuración SIFEN centralizada */
export class SifenConfig {
  private readonly environment: SifenEnvironment;
  private readonly certificatePath: string;
  private readonly certificatePassword: string;
  private readonly privateKeyPath?: string;

  constructor(props: SifenConfigProps) {
    if (!props.certificatePath) {
      throw new Error('certificatePath es requerido');
    }
    if (!props.certificatePassword) {
      throw new Error('certificatePassword es requerido');
    }

    this.environment = props.environment;
    this.certificatePath = props.certificatePath;
    this.certificatePassword = props.certificatePassword;
    this.privateKeyPath = props.privateKeyPath;
  }

  get baseUrl(): string {
    return this.environment === 'test'
      ? 'https://sifen-test.set.gov.py/de/ws/'
      : 'https://sifen.set.gov.py/de/ws/';
  }

  getCertificatePath(): string {
    return this.certificatePath;
  }

  getCertificatePassword(): string {
    return this.certificatePassword;
  }

  getPrivateKeyPath(): string | undefined {
    return this.privateKeyPath;
  }

  getEnvironment(): SifenEnvironment {
    return this.environment;
  }

  isTest(): boolean {
    return this.environment === 'test';
  }
}
