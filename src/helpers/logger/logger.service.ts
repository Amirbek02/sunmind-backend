import { Injectable, LoggerService } from '@nestjs/common';
import * as config from '../../../msdata/configs/config.default.json';
import { Console } from '../loggers/console.logger';

@Injectable()
export class CustomLogger implements LoggerService {
  private _logLevel = ['trace', 'debug', 'info', 'warn', 'error'];
  constructor() {
    this.initLogLevel(config.logger.logLevel);
  }

  private readonly _consoleLogger = new Console();

  async trace(message: any, refId: string) {
    try {
      if (this._logLevel.length === 5) {
        this.log('TRACE', message, refId);
      }
      return null;
    } catch (error) {
      throw error;
    }
  }

  async debug(message: string, refId: string) {
    try {
      if (this._logLevel.length >= 4) {
        this.log('DEBUG', message, refId);
      }
    } catch (error) {
      throw error;
    }
  }

  async info(message: string, refId: string) {
    try {
      if (this._logLevel.length >= 3) {
        this.log('INFO', message, refId);
      }
    } catch (error) {
      throw error;
    }
  }

  async warn(message: any, refId: string) {
    try {
      if (this._logLevel.length >= 2) {
        this.log('WARN', message, refId);
      }
    } catch (error) {
      throw error;
    }
  }

  async error(message: any, refId: string) {
    try {
      if (this._logLevel.length >= 1) {
        this.log('ERROR', message, refId);
      }
    } catch (error) {
      throw error;
    }
  }

  log(logLabel: string, message: string, refId: string): boolean {
    try {
      const logMode = config.logger.logMode.toLocaleLowerCase();

      if (
        logLabel === 'INFO' ||
        (logLabel === 'info' && logMode !== 'console')
      ) {
        this._consoleLogger.info(message, refId);
      }

      switch (logMode) {
        case 'console':
          const label = logLabel.toLocaleLowerCase();
          logLabel !== 'info' && logLabel !== 'INFO'
            ? this._consoleLogger[label](message, refId)
            : '';
          break;
        default:
          this._consoleLogger.debug(message, refId);
      }

      return true;
    } catch (error) {
      this._consoleLogger.error(`REASON: ${error.message}`, '');
      return error;
    }
  }

  private initLogLevel(level: string) {
    switch (level.toLocaleLowerCase()) {
      case 'debug':
        this._logLevel.splice(0, 1);
        break;
      case 'info':
        this._logLevel = this._logLevel.splice(0, 2);
        break;
      case 'warn':
        this._logLevel = this._logLevel.splice(0, 3);
        break;
      case 'error':
        this._logLevel = this._logLevel.splice(0, 4);
        break;
    }
  }
}
