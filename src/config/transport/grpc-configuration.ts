export interface IGrpcConfiguration {
  getDeadlineMilliseconds(): number;
  withDeadlineMilliseconds(deadlineMilliseconds: number): IGrpcConfiguration;
  getMaxSessionMemory(): number;
  withMaxSessionMemory(maxSessionMemory: number): IGrpcConfiguration;
}
