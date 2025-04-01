import {Channel} from '@grpc/grpc-js';
import {ConnectivityState} from '@grpc/grpc-js/build/src/connectivity-state';
import {GrpcClientWithChannel} from '../../../src/internal/grpc/grpc-client-wrapper';
import {IdleGrpcClientWrapper} from '../../../src/internal/grpc/idle-grpc-client-wrapper';
import {
  DefaultMomentoLoggerFactory,
  DefaultMomentoLoggerLevel,
} from '../../../src';

const createMockChannel = (state: ConnectivityState): jest.Mocked<Channel> => {
  return {
    getConnectivityState: jest.fn(() => state),
  } as unknown as jest.Mocked<Channel>;
};

const createMockGrpcClient = (
  channel: jest.Mocked<Channel>
): jest.Mocked<GrpcClientWithChannel> => ({
  close: jest.fn(),
  getChannel: jest.fn(() => channel),
});

describe('IdleGrpcClientWrapper', () => {
  let now: number;
  const loggerFactory = new DefaultMomentoLoggerFactory(
    DefaultMomentoLoggerLevel.INFO
  );

  beforeEach(() => {
    jest.useFakeTimers();
    now = Date.now();
    jest.setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('returns the same client if not idle and channel is healthy', () => {
    const channel = createMockChannel(ConnectivityState.READY);
    const client = createMockGrpcClient(channel);

    const wrapper = new IdleGrpcClientWrapper<GrpcClientWithChannel>({
      clientFactoryFn: () => client,
      loggerFactory: loggerFactory,
      maxIdleMillis: 10000,
    });

    wrapper.getClient(); // first call to getClient() initializes the client
    jest.advanceTimersByTime(500); // simulate 500ms
    wrapper.getClient(); // second call should return the same client
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(client.close).not.toHaveBeenCalled();
  });

  it('recreates the client if the gRPC channel is in TRANSIENT_FAILURE', () => {
    // create a mock client whose channel is in a bad state
    const badChannel = createMockChannel(ConnectivityState.TRANSIENT_FAILURE);
    const badClient = createMockGrpcClient(badChannel);

    const factory = jest
      .fn<GrpcClientWithChannel, []>()
      .mockReturnValue(badClient);

    const wrapper = new IdleGrpcClientWrapper<GrpcClientWithChannel>({
      clientFactoryFn: factory,
      loggerFactory,
      maxIdleMillis: 10000,
    });

    // call getClient(), which should recreate the client due to bad channel
    wrapper.getClient();
    // factory should be called twice (initial + reconnection)
    expect(factory).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000); // Advance time to ensure the client is closed
    // the first client should be closed
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(badClient.close).toHaveBeenCalledTimes(1);
  });

  it('recreates the client if it exceeds maxIdleMillis', () => {
    const initialChannel = createMockChannel(ConnectivityState.READY);
    const newChannel = createMockChannel(ConnectivityState.READY);

    const initialClient = createMockGrpcClient(initialChannel);
    const newClient = createMockGrpcClient(newChannel);

    const factory = jest
      .fn<GrpcClientWithChannel, []>()
      .mockReturnValueOnce(initialClient)
      .mockReturnValueOnce(newClient);

    const wrapper = new IdleGrpcClientWrapper<GrpcClientWithChannel>({
      clientFactoryFn: factory,
      loggerFactory,
      maxIdleMillis: 10_000,
      maxClientAgeMillis: 60_000, // longer, so it won’t interfere
    });

    // Initial client use
    const c1 = wrapper.getClient();
    expect(c1).toBe(initialClient);

    // Advance past idle threshold only
    jest.advanceTimersByTime(15_000);

    const c2 = wrapper.getClient();
    expect(c2).toBe(newClient);
    expect(factory).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000); // Advance time to ensure the client is closed
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(initialClient.close).toHaveBeenCalledTimes(1);
  });

  it('recreates the client if it exceeds maxClientAgeMillis', () => {
    const initialChannel = createMockChannel(ConnectivityState.READY);
    const newChannel = createMockChannel(ConnectivityState.READY);

    const initialClient = createMockGrpcClient(initialChannel);
    const newClient = createMockGrpcClient(newChannel);

    const factory = jest
      .fn<GrpcClientWithChannel, []>()
      .mockReturnValueOnce(initialClient)
      .mockReturnValueOnce(newClient);

    const wrapper = new IdleGrpcClientWrapper<GrpcClientWithChannel>({
      clientFactoryFn: factory,
      loggerFactory,
      maxIdleMillis: 60_000, // longer, so it won’t interfere
      maxClientAgeMillis: 10_000,
    });

    // Initial use
    const c1 = wrapper.getClient();
    expect(c1).toBe(initialClient);

    // Regular usage, but pass age threshold
    jest.advanceTimersByTime(12_000);

    const c2 = wrapper.getClient();
    expect(c2).toBe(newClient);
    expect(factory).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(1000); // Advance time to ensure the client is closed
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(initialClient.close).toHaveBeenCalledTimes(1);
  });
});
