import { jest, expect, it, describe, beforeAll, afterAll } from '@jest/globals';
import { LogLevel } from '../../src/enum/index';
import { FlagshipLogManager } from '../../src/utils/FlagshipLogManager';
import { formatLogOutput } from '../../src/utils/utils';


describe('FlagshipLogManager', () => {

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2023-01-01T09:10:35.400Z'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });
  const log = jest.spyOn(console, 'log');
  const logError = jest.spyOn(console, 'error');
  const logDebug = jest.spyOn(console, 'debug');
  const logInfo = jest.spyOn(console, 'info');
  const logWarn = jest.spyOn(console, 'warn');

  const logManager = new FlagshipLogManager();
  const message = 'this is a log message';
  const tag = 'tag';

  it('should log alert message with correct format', () => {
    logManager.alert(message, tag);
    expect(logError).toBeCalledWith(formatLogOutput(LogLevel.ALERT, message, tag));
  });

  it('should log critical message with correct format', () => {
    logManager.critical(message, tag);
    expect(logError).toBeCalledWith(formatLogOutput(LogLevel.CRITICAL, message, tag));
  });

  it('should log debug message with correct format', () => {
    logManager.debug(message, tag);
    expect(logDebug).toBeCalledWith(formatLogOutput(LogLevel.DEBUG, message, tag));
  });

  it('should log emergency message with correct format', () => {
    logManager.emergency(message, tag);
    expect(logError).toBeCalledWith(formatLogOutput(LogLevel.EMERGENCY, message, tag));
  });

  it('should log error message with correct format', () => {
    logManager.error(message, tag);
    expect(logError).toBeCalledWith(formatLogOutput(LogLevel.ERROR, message, tag));
  });

  it('should log info message with correct format', () => {
    logManager.info(message, tag);
    expect(logInfo).toBeCalledWith(formatLogOutput(LogLevel.INFO, message, tag));
  });

  it('should log notice message with correct format', () => {
    logManager.notice(message, tag);
    expect(log).toBeCalledWith(formatLogOutput(LogLevel.NOTICE, message, tag));
  });

  it('should log warning message with correct format', () => {
    logManager.warning(message, tag);
    expect(logWarn).toBeCalledWith(formatLogOutput(LogLevel.WARNING, message, tag));
  });
});
