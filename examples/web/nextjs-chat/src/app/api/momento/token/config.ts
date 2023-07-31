import {
  AllDataReadWrite,
  ExpiresIn,
  TopicRole, 
  CacheRole, 
  TokenScope, 
  AllTopics, 
  AllCaches,
  TokenScopes
} from "@gomomento/sdk";

/**
 * First, set the scope of permissions for your tokens. 
 * 
 * AllDataReadWrite provides read and write permissions to all of your caches:
 *    export const tokenPermissions: TokenScope =  AllDataReadWrite;
 * 
 * TokenScopes provides several functions that will return the permissions you
 * request for a given cache and topic name.
 *    export const tokenPermissions: TokenScope = TokenScopes.topicPublishSubscribe("your-cache-name", AllTopics);
 * 
 * You can also set it to allow subscriptions to topics in all caches if you prefer:
 *    export const tokenPermissions: TokenScope = TokenScopes.topicPublishSubscribe(AllCaches, AllTopics);
 * 
 * You may also provide a bespoke list of permissions for each cache and topic that you have:
 *    export const tokenPermissions: TokenScope =  {
 *      permissions: [
 *        {
 *          role: CacheRole.ReadWrite | CacheRole.ReadOnly, 
 *          cache: AllCaches | "your-cache-name"
 *        },
 *        {
 *          role: TopicRole.PublishSubscribe | TopicRole.SubscribeOnly, 
 *          cache: AllCaches | "your-cache-name",
 *          topic: AllTopics | "your-topic-name"
 *        }
 *      ]
 *    };
 * 
 * More information here: https://docs.momentohq.com/develop/api-reference/auth-tokens#tokenscope-objects
 */
export const tokenPermissions: TokenScope = TokenScopes.topicPublishSubscribe(AllCaches, AllTopics);

/**
 * Second, set the TTL for your tokens in terms of seconds, minutes, hours,  
 * days, or using epoch format. You may also set tokens to never expire.
 * More information here: https://docs.momentohq.com/develop/api-reference/auth-tokens#generateauthtoken-api
 */
export const tokenExpiresIn: ExpiresIn = ExpiresIn.minutes(30);