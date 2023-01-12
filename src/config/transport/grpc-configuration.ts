export interface GrpcConfiguration {
  getDeadlineMilliseconds(): number;
  withDeadlineMilliseconds(deadlineMilliseconds: number): GrpcConfiguration;
  getMaxSessionMemory(): number;
  withMaxSessionMemory(maxSessionMemory: number): GrpcConfiguration;
}
