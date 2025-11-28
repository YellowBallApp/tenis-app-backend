import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Error log storage key
const ERROR_LOG_KEY = '@tenis_app:error_logs';

export interface ErrorLog {
  timestamp: string;
  error: string;
  stack?: string;
  componentStack?: string;
  props?: any;
  userInfo?: any;
}

class ErrorLogger {
  private maxLogs = 50; // Maximum number of logs to keep

  /**
   * Log an error with detailed information
   */
  async logError(error: Error, componentStack?: string, props?: any) {
    try {
      const errorLog: ErrorLog = {
        timestamp: new Date().toISOString(),
        error: error.toString(),
        stack: error.stack,
        componentStack,
        props: this.sanitizeProps(props),
        userInfo: {
          platform: Platform.OS,
          platformVersion: Platform.Version,
        },
      };

      console.error('🚨 ERROR LOGGED:', errorLog);

      // Save to AsyncStorage
      const existingLogs = await this.getStoredLogs();
      const updatedLogs = [errorLog, ...existingLogs].slice(0, this.maxLogs);
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updatedLogs));

      // Check if it's a boolean casting error
      if (this.isBooleanCastingError(error)) {
        console.error('⚠️ BOOLEAN CASTING ERROR DETECTED:', {
          message: error.message,
          stack: error.stack,
          props: this.sanitizeProps(props),
        });
        
        // In development, show alert
        if (__DEV__) {
          Alert.alert(
            'Boolean Casting Error Detected',
            `Error: ${error.message}\n\nCheck console for details.`,
            [{ text: 'OK' }]
          );
        }
      }

      // Also log to native side for better visibility
      if (Platform.OS === 'android') {
        this.logToNative('ERROR', JSON.stringify(errorLog));
      }
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  /**
   * Check if error is related to boolean casting
   */
  private isBooleanCastingError(error: Error): boolean {
    const errorString = error.toString().toLowerCase();
    const stackString = error.stack?.toLowerCase() || '';
    
    return (
      errorString.includes('boolean') ||
      errorString.includes('cast') ||
      errorString.includes('string cannot be cast') ||
      stackString.includes('boolean') ||
      stackString.includes('cast')
    );
  }

  /**
   * Log native module errors (like Java exceptions)
   */
  logNativeError(errorMessage: string, stackTrace?: string) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      error: errorMessage,
      stack: stackTrace,
      userInfo: {
        platform: Platform.OS,
        platformVersion: Platform.Version,
        isNativeError: true,
      },
    };

    console.error('🚨 NATIVE ERROR LOGGED:', errorLog);

    // Save to AsyncStorage
    this.getStoredLogs().then((existingLogs) => {
      const updatedLogs = [errorLog, ...existingLogs].slice(0, this.maxLogs);
      AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(updatedLogs)).catch(
        (err) => console.error('Failed to save native error log:', err)
      );
    });

    // Check if it's boolean casting error
    if (
      errorMessage.includes('Boolean') ||
      errorMessage.includes('cast') ||
      errorMessage.includes('String cannot be cast')
    ) {
      console.error('⚠️ NATIVE BOOLEAN CASTING ERROR:', {
        message: errorMessage,
        stack: stackTrace,
      });
    }
  }

  /**
   * Get all stored error logs
   */
  async getStoredLogs(): Promise<ErrorLog[]> {
    try {
      const logsJson = await AsyncStorage.getItem(ERROR_LOG_KEY);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Failed to get stored logs:', error);
      return [];
    }
  }

  /**
   * Clear all error logs
   */
  async clearLogs() {
    try {
      await AsyncStorage.removeItem(ERROR_LOG_KEY);
      console.log('Error logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Get logs as formatted string for sharing/debugging
   */
  async getLogsAsString(): Promise<string> {
    const logs = await this.getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }

  /**
   * Sanitize props to remove sensitive data
   */
  private sanitizeProps(props: any): any {
    if (!props) return null;
    
    try {
      const sanitized = JSON.parse(JSON.stringify(props));
      
      // Remove sensitive keys
      const sensitiveKeys = ['password', 'token', 'accessToken', 'refreshToken'];
      const sanitizeObject = (obj: any): any => {
        if (typeof obj !== 'object' || obj === null) return obj;
        if (Array.isArray(obj)) return obj.map(sanitizeObject);
        
        const result: any = {};
        for (const key in obj) {
          if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeObject(obj[key]);
          }
        }
        return result;
      };
      
      return sanitizeObject(sanitized);
    } catch {
      return { error: 'Could not serialize props' };
    }
  }

  /**
   * Log to native side (Android only)
   */
  private logToNative(level: string, message: string) {
    try {
      // Use console.log which will be captured by native logging
      console.log(`[${level}] ${message}`);
    } catch (error) {
      console.error('Failed to log to native:', error);
    }
  }
}

export const errorLogger = new ErrorLogger();

// Global error handler setup
if (typeof ErrorUtils !== 'undefined') {
  const originalHandler = ErrorUtils.getGlobalHandler();
  
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.error('🚨 GLOBAL ERROR HANDLER:', {
      error: error.toString(),
      stack: error.stack,
      isFatal,
    });
    
    // Log the error
    errorLogger.logError(error);
    
    // Check if it's a native error
    if (error.message?.includes('native') || error.stack?.includes('native')) {
      errorLogger.logNativeError(error.message, error.stack);
    }
    
    // Call original handler
    if (originalHandler) {
      originalHandler(error, isFatal);
    }
  });
}

