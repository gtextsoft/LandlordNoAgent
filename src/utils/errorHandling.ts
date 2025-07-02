import { toast } from "@/hooks/use-toast";

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication required') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NetworkError extends Error {
  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Enhanced error handler with consistent user feedback and logging
 */
export const handleError = (
  error: any,
  toastFn: typeof toast,
  fallbackMessage: string = 'An unexpected error occurred',
  options: {
    shouldLog?: boolean;
    shouldShowToast?: boolean;
    context?: string;
  } = {}
) => {
  const { shouldLog = true, shouldShowToast = true, context } = options;

  // Log error for debugging
  if (shouldLog) {
    const logContext = context ? `[${context}]` : '';
    console.error(`${logContext} Error:`, error);
  }

  let title = 'Error';
  let description = fallbackMessage;
  let variant: 'default' | 'destructive' = 'destructive';

  // Handle different error types
  if (error instanceof ValidationError) {
    title = 'Validation Error';
    description = error.message;
  } else if (error instanceof AuthenticationError) {
    title = 'Authentication Required';
    description = error.message;
  } else if (error instanceof AuthorizationError) {
    title = 'Access Denied';
    description = error.message;
  } else if (error instanceof NetworkError) {
    title = 'Connection Error';
    description = error.message;
  } else if (error instanceof DatabaseError) {
    title = 'Database Error';
    description = 'Unable to complete your request. Please try again.';
  } else if (error?.message) {
    // Supabase or other API errors
    if (error.message.includes('JWT')) {
      title = 'Session Expired';
      description = 'Please sign in again to continue.';
    } else if (error.message.includes('violates foreign key constraint')) {
      title = 'Invalid Reference';
      description = 'The requested item could not be found.';
    } else if (error.message.includes('duplicate key value')) {
      title = 'Duplicate Entry';
      description = 'This item already exists.';
    } else if (error.message.includes('permission denied')) {
      title = 'Permission Denied';
      description = 'You do not have permission to perform this action.';
    } else {
      description = error.message;
    }
  }

  // Show user-friendly toast notification
  if (shouldShowToast) {
    toastFn({
      title,
      description,
      variant,
    });
  }

  return { title, description, variant };
};

/**
 * Enhanced success handler
 */
export const handleSuccess = (
  message: string,
  toastFn: typeof toast,
  options: {
    title?: string;
    duration?: number;
    shouldLog?: boolean;
    context?: string;
  } = {}
) => {
  const { title = 'Success', duration = 3000, shouldLog = false, context } = options;

  if (shouldLog) {
    const logContext = context ? `[${context}]` : '';
    console.log(`${logContext} Success:`, message);
  }

  toastFn({
    title,
    description: message,
    variant: 'default',
    duration,
  });
};

/**
 * Async operation wrapper with error handling
 */
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  toastFn: typeof toast,
  fallbackMessage: string = 'Operation failed',
  context?: string
): Promise<T | null> => {
  try {
    return await operation();
  } catch (error) {
    handleError(error, toastFn, fallbackMessage, { context });
    return null;
  }
};

/**
 * Validation helper
 */
export const validateRequired = (value: any, fieldName: string): void => {
  if (value === null || value === undefined || value === '') {
    throw new ValidationError(`${fieldName} is required`);
  }
};

export const validateEmail = (email: string): void => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new ValidationError('Please enter a valid email address');
  }
};

export const validatePhone = (phone: string): void => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(phone)) {
    throw new ValidationError('Please enter a valid phone number');
  }
};

/**
 * Role authorization helper
 */
export const requireRole = (userRoles: string[], requiredRole: string): void => {
  if (!userRoles.includes(requiredRole)) {
    throw new AuthorizationError(`This action requires ${requiredRole} privileges`);
  }
};

/**
 * Authentication helper
 */
export const requireAuth = (user: any): void => {
  if (!user) {
    throw new AuthenticationError('Please sign in to continue');
  }
};

/**
 * Database query error parser
 */
export const parseSupabaseError = (error: any): AppError => {
  if (!error) return new Error('Unknown error occurred');

  const appError = new Error(error.message || 'Database operation failed') as AppError;
  appError.code = error.code;
  appError.details = error.details;

  // Parse common Supabase error codes
  switch (error.code) {
    case '23505': // unique_violation
      appError.message = 'This item already exists';
      break;
    case '23503': // foreign_key_violation
      appError.message = 'Referenced item not found';
      break;
    case '42501': // insufficient_privilege
      appError.message = 'Permission denied';
      break;
    case 'PGRST116': // invalid JWT
      appError.message = 'Session expired. Please sign in again.';
      break;
    default:
      break;
  }

  return appError;
};

/**
 * Retry mechanism for failed operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}; 