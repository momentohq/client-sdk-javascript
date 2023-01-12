import {GrpcConfiguration} from './grpc-configuration';

export interface TransportStrategy {
  getMaxConcurrentRequests(): number | null;

  getGrpcConfig(): GrpcConfiguration;

  // TODO: for use in middleware
  withMaxConcurrentRequests(maxConcurrentRequests: number): TransportStrategy;

  withGrpcConfig(grpcConfig: GrpcConfiguration): TransportStrategy;

  withClientTimeout(clientTimeout: number): TransportStrategy;
}

export class StaticGrpcConfiguration implements GrpcConfiguration {
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

export class StaticTransportStrategy implements TransportStrategy {
  private readonly maxConcurrentRequests: number | null;
  private readonly grpcConfig: GrpcConfiguration;

  constructor(
    maxConcurrentRequests: number | null,
    grpcConfiguration: GrpcConfiguration
  ) {
    this.maxConcurrentRequests = maxConcurrentRequests;
    this.grpcConfig = grpcConfiguration;
  }

  getMaxConcurrentRequests(): number | null {
    return this.maxConcurrentRequests;
  }

  getGrpcConfig(): GrpcConfiguration {
    return this.grpcConfig;
  }

  withMaxConcurrentRequests(
    maxConcurrentRequests: number
  ): StaticTransportStrategy {
    return new StaticTransportStrategy(maxConcurrentRequests, this.grpcConfig);
  }

  withGrpcConfig(grpcConfig: GrpcConfiguration): StaticTransportStrategy {
    return new StaticTransportStrategy(this.maxConcurrentRequests, grpcConfig);
  }

  withClientTimeout(clientTimeout: number): StaticTransportStrategy {
    return new StaticTransportStrategy(
      this.maxConcurrentRequests,
      this.grpcConfig.withDeadlineMilliseconds(clientTimeout)
    );
  }
}
