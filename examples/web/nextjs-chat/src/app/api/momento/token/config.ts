import {
  ExpiresIn,
  AllTopics,
  AllCaches,
  TokenScopes,
  type DisposableTokenScope,
} from "@gomomento/sdk";

/**
 * First, set the scope of permissions for your tokens.
 *
 * AllDataReadWrite provides read and write permissions to all of your caches:
 *    export const tokenPermissions: DisposableTokenScope =  AllDataReadWrite;
 *
 * TokenScopes provides several functions that will return the permissions you
 * request for a given cache and topic name.
 *    export const tokenPermissions: DisposableTokenScope = TokenScopes.topicPublishSubscribe("your-cache-name", AllTopics);
 *
 * You can also set it to allow subscriptions to topics in all caches if you prefer:
 *    export const tokenPermissions: DisposableTokenScope = TokenScopes.topicPublishSubscribe(AllCaches, AllTopics);
 *
 * You may also provide a bespoke list of permissions for each cache and topic that you have.
 * The DisposableTokenScope will accept permissions of the type CachePermission, TopicPermission,
 * or DisposableTokenCachePermission, as outlined below respectively:
 *    export const tokenPermissions: DisposableTokenScope =  {
 *      permissions: [
 *        {
 *          role: CacheRole.ReadWrite | CacheRole.ReadOnly | CacheRole.WriteOnly,
 *          cache: AllCaches | "your-cache-name"
 *        },
 *        {
 *          role: TopicRole.PublishSubscribe | TopicRole.SubscribeOnly | TopicRole.PublishOnly,
 *          cache: AllCaches | "your-cache-name",
 *          topic: AllTopics | "your-topic-name"
 *        },
 *        {
 *          role: CacheRole.ReadWrite | CacheRole.ReadOnly | CacheRole.WriteOnly,
 *          cache: AllCaches | "your-cache-name",
 *          item: AllCacheItems | {key: "MyKey"}
 *        },
 *      ]
 *    };
 *
 * This example app generates diposable tokens by default so it uses the DisposableTokenScope
 * to specify cache and topic permissions.
 * More information here: https://docs.momentohq.com/develop/api-reference/auth-tokens#disposabletokenscope-objects
 */
export const tokenPermissions: DisposableTokenScope =
  TokenScopes.topicPublishSubscribe(AllCaches, AllTopics);

/**
 * Second, set the TTL for your tokens in terms of seconds, minutes, hours,
 * days, or using epoch format.
 * This example app generates disposable tokens by default and disposable
 * tokens must expire within 1 hour.
 * More information here: https://docs.momentohq.com/develop/api-reference/auth-tokens#generatedisposabletoken-api
 */
export const tokenExpiresIn: ExpiresIn = ExpiresIn.minutes(30);

/**
 * Third, set the authentication method for requesting Momento tokens to protect against
 * unauthorized requests. The available options are provided below.
 */
export enum AuthenticationMethod {
  Open, // no authentication
  Credentials, // use a basic username and password login
  // OAuth,     // use an OAuth provider using a library such as NextAuth.js
}
export const authenticationMethod: AuthenticationMethod =
  AuthenticationMethod.Open;
