export class AppError extends Error {
  public constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details: readonly unknown[] = [],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class BadRequestError extends AppError {
  public constructor(
    message = 'La solicitud contiene datos inválidos.',
    code = 'VALIDATION_ERROR',
    details: readonly unknown[] = [],
  ) {
    super(400, code, message, details);
  }
}

export class UnauthorizedError extends AppError {
  public constructor(
    message = 'Debe autenticarse para continuar.',
    code = 'UNAUTHORIZED',
  ) {
    super(401, code, message);
  }
}

export class LockedError extends AppError {
  public constructor(message: string, code = 'ACCOUNT_LOCKED') {
    super(423, code, message);
  }
}

export class TooManyRequestsError extends AppError {
  public constructor() {
    super(
      429,
      'TOO_MANY_REQUESTS',
      'Demasiados intentos. Espere antes de volver a intentarlo.',
    );
  }
}

export class ForbiddenError extends AppError {
  public constructor(message = 'No tiene permisos para realizar esta acción.') {
    super(403, 'INSUFFICIENT_PERMISSIONS', message);
  }
}

export class NotFoundError extends AppError {
  public constructor(message = 'El recurso solicitado no existe.') {
    super(404, 'NOT_FOUND', message);
  }
}

export class ConflictError extends AppError {
  public constructor(message: string, code = 'CONFLICT') {
    super(409, code, message);
  }
}

export class UnprocessableEntityError extends AppError {
  public constructor(message: string, code = 'BUSINESS_RULE_VIOLATION') {
    super(422, code, message);
  }
}

export class ServiceUnavailableError extends AppError {
  public constructor(message: string, code: string, options?: ErrorOptions) {
    super(503, code, message, [], options);
  }
}
