/* eslint-disable no-console */
import { LogVerbosityLevel } from '../types/enums';
import { logVerbosity } from './env';

/**
 * Helper function that formats a date in the format hh:mm mm-dd-yyyy
 */
const formatDate = (date: Date): string => {
  const hours: number = date.getHours();
  const minutes: string = String(date.getMinutes()).padStart(2, '0');
  const day: string = String(date.getDate()).padStart(2, '0');
  const month: string = String(date.getMonth() + 1).padStart(2, '0');
  const year: number = date.getFullYear();

  return `${hours}:${minutes} ${month}-${day}-${year}`;
};

/**
 * Helper function that converts verbosity level to single character
 */
const verbosityToCharacter = (verbosity: LogVerbosityLevel): string => {
  switch (verbosity) {
    case LogVerbosityLevel.Verbose:
      return 'V';
    case LogVerbosityLevel.Info:
      return 'I';
    case LogVerbosityLevel.Warning:
      return 'W';
    case LogVerbosityLevel.Error:
      return 'E';
    default:
      return 'I';
  }
};

/**
 * Class that handles logging
 */
export class Log {
  /**
   * Logs an info message
   * @param args Arguments to log
   */
  public static info(...args: unknown[]): void {
    this.log(LogVerbosityLevel.Info, ...args);
  }

  /**
   * Logs a verbose message
   * @param args Arguments to log
   */
  public static verbose(...args: unknown[]): void {
    this.log(LogVerbosityLevel.Verbose, ...args);
  }

  /**
   * Logs a warning message
   * @param args Arguments to log
   */
  public static warning(...args: unknown[]): void {
    this.log(LogVerbosityLevel.Warning, ...args);
  }

  /**
   * Logs an error message
   * @param args Arguments to log
   */
  public static error(...args: unknown[]): void {
    this.log(LogVerbosityLevel.Error, ...args);
  }

  /**
   * Print a log to stdout according to the verbosity specified
   * in `LOG_VERBOSITY`
   */
  private static log(logLevel: LogVerbosityLevel, ...args: unknown[]): void {
    if ((logLevel as number) < (logVerbosity as number)) return;

    const verbosityCharacter: string = verbosityToCharacter(logLevel);
    const timeString: string = formatDate(new Date());

    const fullMessage: string = `[${verbosityCharacter}] [${timeString}]`;

    if (logLevel === LogVerbosityLevel.Warning) {
      console.warn(fullMessage, ...args);
    } else if (logLevel === LogVerbosityLevel.Error) {
      console.error(fullMessage, ...args);
    } else {
      console.log(fullMessage, ...args);
    }
  }
}
