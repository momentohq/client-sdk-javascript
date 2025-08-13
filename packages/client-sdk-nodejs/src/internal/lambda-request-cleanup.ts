import {ClientUnaryCall, ClientReadableStream} from '@grpc/grpc-js';

/**
 * Lambda Request Cleanup Manager
 *
 * Tracks in-flight gRPC requests and provides a mechanism to cancel them before
 * Lambda invocation ends. This prevents socket exhaustion from zombie requests
 * that remain when Lambda freezes.
 */
export class LambdaRequestCleanup {
  private static activeRequests = new Set<
    ClientUnaryCall | ClientReadableStream<unknown>
  >();

  /**
   * Register a gRPC call to be tracked for cleanup
   */
  static registerCall(
    call: ClientUnaryCall | ClientReadableStream<unknown>
  ): void {
    this.activeRequests.add(call);

    // Auto-cleanup on status change (covers both success and error cases)
    call.on('status', () => this.activeRequests.delete(call));
  }

  /**
   * Cancel all in-flight gRPC requests
   * Call this before Lambda invocation ends to prevent socket leaks
   */
  static cancelAllRequests(): void {
    if (this.activeRequests.size > 0) {
      console.log(
        `[LambdaRequestCleanup] Cancelling ${this.activeRequests.size} in-flight requests`
      );

      for (const call of this.activeRequests) {
        try {
          call.cancel();
        } catch (error: unknown) {
          console.warn(
            '[LambdaRequestCleanup] Error cancelling request:',
            error
          );
        }
      }

      this.activeRequests.clear();
    }
  }

  /**
   * Get count of active requests (for monitoring/debugging)
   */
  static getActiveRequestCount(): number {
    return this.activeRequests.size;
  }

  /**
   * Auto-setup for Lambda environment
   * Registers cleanup handlers for common Lambda termination events
   */
  static setupLambdaCleanup(): void {
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      // Register cleanup before Lambda runtime freezes
      process.on('beforeExit', () => {
        this.cancelAllRequests();
      });

      // Also register for SIGTERM (used by Lambda for graceful shutdown)
      process.on('SIGTERM', () => {
        this.cancelAllRequests();

        // eslint-disable-next-line no-process-exit
        process.exit(0);
      });
    }
  }
}

// Auto-initialize if running in Lambda
if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
  LambdaRequestCleanup.setupLambdaCleanup();
}
