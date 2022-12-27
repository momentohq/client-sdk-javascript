import {IGrpcConfiguration} from './grpc-configuration';

export interface ITransportStrategy {
  getMaxConcurrentRequests(): number | null;

  getGrpcConfig(): IGrpcConfiguration;

  // TODO: for use in middleware
  withMaxConcurrentRequests(maxConcurrentRequests: number): ITransportStrategy;

  withGrpcConfig(grpcConfig: IGrpcConfiguration): ITransportStrategy;

  withClientTimeout(clientTimeout: number): ITransportStrategy;
}

export class StaticGrpcConfiguration implements IGrpcConfiguration {
  private readonly deadlineMilliseconds: number;
  private readonly maxSessionMemory: number;
  constructor(deadlineMilliseconds: number, maxSessionMemory: number) {
    this.deadlineMilliseconds = deadlineMilliseconds;
    this.maxSessionMemory = maxSessionMemory;
  }

  getDeadlineMilliseconds(): number {
    return this.deadlineMilliseconds;
  }

  getMaxSessionMemory(): number {
    return this.maxSessionMemory;
  }

  withDeadlineMilliseconds(
    deadlineMilliseconds: number
  ): StaticGrpcConfiguration {
    return new StaticGrpcConfiguration(
      deadlineMilliseconds,
      this.maxSessionMemory
    );
  }

  withMaxSessionMemory(maxSessionMemory: number): StaticGrpcConfiguration {
    return new StaticGrpcConfiguration(
      this.deadlineMilliseconds,
      maxSessionMemory
    );
  }
}

export class StaticTransportStrategy implements ITransportStrategy {
  private readonly maxConcurrentRequests: number | null;
  private readonly grpcConfig: IGrpcConfiguration;

  constructor(
    maxConcurrentRequests: number | null,
    grpcConfiguration: IGrpcConfiguration
  ) {
    this.maxConcurrentRequests = maxConcurrentRequests;
    this.grpcConfig = grpcConfiguration;
  }

  getMaxConcurrentRequests(): number | null {
    return this.maxConcurrentRequests;
  }

  getGrpcConfig(): IGrpcConfiguration {
    return this.grpcConfig;
  }

  withMaxConcurrentRequests(
    maxConcurrentRequests: number
  ): StaticTransportStrategy {
    return new StaticTransportStrategy(maxConcurrentRequests, this.grpcConfig);
  }

  withGrpcConfig(grpcConfig: IGrpcConfiguration): StaticTransportStrategy {
    return new StaticTransportStrategy(this.maxConcurrentRequests, grpcConfig);
  }

  withClientTimeout(clientTimeout: number): StaticTransportStrategy {
    return new StaticTransportStrategy(
      this.maxConcurrentRequests,
      this.grpcConfig.withDeadlineMilliseconds(clientTimeout)
    );
  }
}
