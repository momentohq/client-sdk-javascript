import {Configuration} from './configuration';
import {
  TransportStrategy,
  StaticGrpcConfiguration,
  StaticTransportStrategy,
} from './transport/transport-strategy';
import {IGrpcConfiguration} from './transport/grpc-configuration';

export class Laptop extends Configuration {
  constructor(transportStrategy: TransportStrategy, maxIdleMillis: number) {
    super(transportStrategy, maxIdleMillis);
  }

  static latest() {
    // 4 minutes.  We want to remain comfortably underneath the idle timeout for AWS NLB, which is 350s.
    const maxIdleMillis = 4 * 60 * 1_000;
    const deadlineMilliseconds = 5000;
    const maxSessionMemory = 256;
    const grpcConfig: IGrpcConfiguration = new StaticGrpcConfiguration(
      deadlineMilliseconds,
      maxSessionMemory
    );
    const transportStrategy: TransportStrategy = new StaticTransportStrategy(
      null,
      grpcConfig
    );
    return new Laptop(transportStrategy, maxIdleMillis);
  }
}
