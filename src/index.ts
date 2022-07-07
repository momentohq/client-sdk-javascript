import {SimpleCacheClient} from './SimpleCacheClient';
import {GetResponse} from './messages/GetResponse';
import {SetResponse} from './messages/SetResponse';
import {CacheGetStatus} from './messages/Result';
import {CacheInfo} from './messages/CacheInfo';
import {
  AlreadyExistsError,
  AuthenticationError,
  CancelledError,
  CacheServiceError,
  LimitExceededError,
  ServiceValidationError,
  InternalServerError,
  InvalidArgumentError,
  UnknownServiceError,
  TimeoutError,
  BadRequestError,
  PermissionError,
  NotFoundError,
} from './Errors';

export {Logger, LoggerOptions, LogLevel, LogFormat, getLogger} from './utils/logging';

export {
  SimpleCacheClient,
  GetResponse,
  SetResponse,
  CacheGetStatus,
  CacheInfo,
  AlreadyExistsError,
  AuthenticationError,
  CancelledError,
  CacheServiceError,
  LimitExceededError,
  ServiceValidationError,
  InternalServerError,
  InvalidArgumentError,
  UnknownServiceError,
  TimeoutError,
  BadRequestError,
  PermissionError,
  NotFoundError,
};
