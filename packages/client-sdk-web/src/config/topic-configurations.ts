import {MomentoLoggerFactory} from '@gomomento/sdk-core';
import {DefaultMomentoLoggerFactory} from './logging/default-momento-logger';
import {
  TopicClientConfiguration,
  TopicConfiguration,
} from './topic-configuration';

const defaultLoggerFactory: MomentoLoggerFactory =
  new DefaultMomentoLoggerFactory();

/**
 * Default config provides defaults suitable for most environments; prioritizes success of publishing and receiving messages.
 * @export
 * @class Default
 */
export class Default extends TopicClientConfiguration {
  /**
   * Provides the latest recommended configuration for a default environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {TopicConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): TopicConfiguration {
    return new TopicClientConfiguration({
      loggerFactory: loggerFactory,
      throwOnErrors: false,
    });
  }
}

/**
 * Laptop config provides defaults suitable for a medium-to-high-latency dev environment.
 * @export
 * @class Laptop
 */
export class Laptop extends TopicClientConfiguration {
  /**
   * Provides the latest recommended configuration for a laptop development environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {TopicConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): TopicConfiguration {
    return Laptop.v1(loggerFactory);
  }

  /**
   * Provides v1 recommended configuration for a laptop development environment.  This configuration is guaranteed not
   * to change in future releases of the Momento web SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {TopicConfiguration}
   */
  static v1(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): TopicConfiguration {
    return new Laptop({
      loggerFactory: loggerFactory,
      throwOnErrors: false,
    });
  }
}

/**
 * Browser config provides defaults suitable for use in a web browser.
 * @export
 * @class Browser
 */
export class Browser extends TopicClientConfiguration {
  /**
   * Provides the latest recommended configuration for an in-browser environment.  NOTE: this configuration may
   * change in future releases to take advantage of improvements we identify for default configurations.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {TopicConfiguration}
   */
  static latest(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): TopicConfiguration {
    return Browser.v1(loggerFactory);
  }

  /**
   * Provides v1 recommended configuration for an in-browser environment.  This configuration is guaranteed not
   * to change in future releases of the Momento web SDK.
   * @param {MomentoLoggerFactory} [loggerFactory=defaultLoggerFactory]
   * @returns {TopicConfiguration}
   */
  static v1(
    loggerFactory: MomentoLoggerFactory = defaultLoggerFactory
  ): TopicConfiguration {
    return new Browser({
      loggerFactory: loggerFactory,
      throwOnErrors: false,
    });
  }
}
