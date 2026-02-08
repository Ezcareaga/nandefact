import { DomainError } from '../errors/DomainError.js';
import type { RolUsuario } from '../shared/types.js';

export interface UsuarioProps {
  id: string;
  comercioId: string;
  nombre: string;
  telefono: string;
  pinHash: string;
  rol: RolUsuario;
  activo?: boolean;
  intentosFallidos?: number;
  bloqueadoHasta?: Date | null;
}

/**
 * Usuario del sistema que puede acceder a un comercio.
 * Doña María (dueña) o empleado.
 * Validaciones:
 * - Nombre no vacío
 * - Teléfono formato válido (7-20 dígitos, opcional +)
 * - PIN hasheado no vacío
 * - Rol debe ser 'dueño' o 'empleado'
 * Rate limiting:
 * - 5 intentos fallidos → bloqueo 30 minutos
 * - Login exitoso → reset intentos
 */
export class Usuario {
  readonly id: string;
  readonly comercioId: string;
  readonly nombre: string;
  readonly telefono: string;
  readonly pinHash: string;
  readonly rol: RolUsuario;
  readonly activo: boolean;
  readonly intentosFallidos: number;
  readonly bloqueadoHasta: Date | null;

  constructor(props: UsuarioProps) {
    // Validar nombre
    const nombreTrimmed = props.nombre.trim();
    if (nombreTrimmed === '') {
      throw new DomainError('El nombre no puede estar vacío');
    }

    // Validar teléfono: 7-20 dígitos, opcional +
    if (!/^\+?\d{7,20}$/.test(props.telefono)) {
      throw new DomainError('El teléfono debe tener entre 7 y 20 dígitos');
    }

    // Validar pinHash
    if (props.pinHash.trim() === '') {
      throw new DomainError('El PIN hash no puede estar vacío');
    }

    // Validar rol en runtime (necesario para casos donde se fuerza el tipo con 'as any')
    const rolesValidos: RolUsuario[] = ['dueño', 'empleado'];
    if (!rolesValidos.includes(props.rol)) {
      throw new DomainError('El rol debe ser "dueño" o "empleado"');
    }

    this.id = props.id;
    this.comercioId = props.comercioId;
    this.nombre = nombreTrimmed;
    this.telefono = props.telefono;
    this.pinHash = props.pinHash;
    this.rol = props.rol;
    this.activo = props.activo ?? true;
    this.intentosFallidos = props.intentosFallidos ?? 0;
    this.bloqueadoHasta = props.bloqueadoHasta ?? null;
  }

  /**
   * Registra un intento fallido de login.
   * Al 5to intento, bloquea por 30 minutos.
   * Retorna nueva instancia (inmutable).
   */
  registrarIntentoFallido(): Usuario {
    const nuevosIntentos = this.intentosFallidos + 1;
    let bloqueadoHasta = this.bloqueadoHasta;

    // Al 5to intento, bloquear por 30 minutos
    if (nuevosIntentos >= 5) {
      bloqueadoHasta = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos
    }

    return new Usuario({
      id: this.id,
      comercioId: this.comercioId,
      nombre: this.nombre,
      telefono: this.telefono,
      pinHash: this.pinHash,
      rol: this.rol,
      activo: this.activo,
      intentosFallidos: nuevosIntentos,
      bloqueadoHasta,
    });
  }

  /**
   * Resetea intentos fallidos y bloqueo.
   * Llamado después de login exitoso.
   * Retorna nueva instancia (inmutable).
   */
  resetearIntentos(): Usuario {
    return new Usuario({
      id: this.id,
      comercioId: this.comercioId,
      nombre: this.nombre,
      telefono: this.telefono,
      pinHash: this.pinHash,
      rol: this.rol,
      activo: this.activo,
      intentosFallidos: 0,
      bloqueadoHasta: null,
    });
  }

  /**
   * Verifica si el usuario está bloqueado en el momento dado.
   * Si bloqueadoHasta es null → no bloqueado
   * Si bloqueadoHasta > ahora → bloqueado
   * Si bloqueadoHasta <= ahora → bloqueo expirado, no bloqueado
   */
  estaBloqueado(ahora: Date = new Date()): boolean {
    if (this.bloqueadoHasta === null) {
      return false;
    }
    return ahora < this.bloqueadoHasta;
  }

  /**
   * Desactiva el usuario (soft delete).
   * Retorna nueva instancia (inmutable).
   */
  desactivar(): Usuario {
    return new Usuario({
      id: this.id,
      comercioId: this.comercioId,
      nombre: this.nombre,
      telefono: this.telefono,
      pinHash: this.pinHash,
      rol: this.rol,
      activo: false,
      intentosFallidos: this.intentosFallidos,
      bloqueadoHasta: this.bloqueadoHasta,
    });
  }
}
