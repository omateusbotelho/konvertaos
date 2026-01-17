/**
 * Global Error Logger
 * Logs errors to Supabase error_logs table for production debugging
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";

export type ErrorType = 
  | 'react_error'      // React component errors caught by ErrorBoundary
  | 'supabase_error'   // Supabase API errors
  | 'network_error'    // Network/fetch errors
  | 'unhandled_error'  // Unhandled promise rejections
  | 'unknown';

export interface ErrorLogData {
  tipo: ErrorType;
  mensagem: string;
  stack_trace?: string;
  componente?: string;
  url?: string;
  user_agent?: string;
  dados_extras?: Record<string, Json>;
}

/**
 * Logs an error to the Supabase error_logs table
 * This is a fire-and-forget operation - we don't want error logging
 * to interfere with the user experience
 */
export async function logError(data: ErrorLogData): Promise<void> {
  try {
    // Get current user if available
    const { data: { user } } = await supabase.auth.getUser();
    
    // Capture browser info
    const errorLog: {
      usuario_id: string | null;
      tipo: string;
      mensagem: string;
      stack_trace: string | null;
      componente: string | null;
      url: string | null;
      user_agent: string | null;
      dados_extras: Json;
    } = {
      usuario_id: user?.id || null,
      tipo: data.tipo,
      mensagem: data.mensagem.substring(0, 5000), // Limit message length
      stack_trace: data.stack_trace?.substring(0, 10000) || null, // Limit stack trace
      componente: data.componente || null,
      url: data.url || (typeof window !== 'undefined' ? window.location.href : null),
      user_agent: data.user_agent || (typeof navigator !== 'undefined' ? navigator.userAgent : null),
      dados_extras: (data.dados_extras || {}) as Json,
    };

    // Fire and forget - don't await to avoid blocking
    supabase
      .from('error_logs')
      .insert([errorLog])
      .then(({ error }) => {
        if (error) {
          // Only log to console in development - avoid infinite loops
          console.error('[ErrorLogger] Failed to log error:', error);
        }
      });
  } catch (e) {
    // Silently fail - we don't want error logging to cause more errors
    console.error('[ErrorLogger] Exception while logging:', e);
  }
}

/**
 * Logs a Supabase-specific error with additional context
 */
export function logSupabaseError(
  error: { message: string; code?: string; details?: string; hint?: string },
  context?: { operation?: string; table?: string; dados_extras?: Record<string, unknown> }
): void {
  logError({
    tipo: 'supabase_error',
    mensagem: `[${context?.operation || 'unknown'}] ${error.message}`,
    stack_trace: JSON.stringify({
      code: error.code,
      details: error.details,
      hint: error.hint,
      table: context?.table,
    }, null, 2),
    dados_extras: {
      ...context?.dados_extras,
      error_code: error.code,
      error_details: error.details,
      error_hint: error.hint,
    },
  });
}

/**
 * Setup global error handlers for unhandled errors and promise rejections
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    logError({
      tipo: 'unhandled_error',
      mensagem: event.message || 'Unknown error',
      stack_trace: event.error?.stack || String(event.error),
      url: event.filename,
      dados_extras: {
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const mensagem = error instanceof Error 
      ? error.message 
      : typeof error === 'string' 
        ? error 
        : 'Unhandled promise rejection';
    
    logError({
      tipo: 'unhandled_error',
      mensagem,
      stack_trace: error instanceof Error ? error.stack : JSON.stringify(error),
    });
  });
}
