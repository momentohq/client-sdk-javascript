import {AllDataReadWrite, TopicRole, CacheRole, ExpiresIn, TokenScope, AllTopics, AllCaches} from '@gomomento/sdk';

/**
 * Set the scope of permissions for your tokens. 
 * 
 * AllDataReadWrite provides read and write permissions to all of your caches:
 *    export const tokenPermissions: TokenScope =  AllDataReadWrite;
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
export const tokenPermissions: TokenScope = {
  permissions: [
    {
      role: CacheRole.ReadWrite,
      cache: "default-cache"
    },
    {
      role: TopicRole.PublishSubscribe, 
      cache: "default-cache",
      topic: AllTopics
    }
]};

/**
 * Set the TTL for your tokens in terms of seconds, minutes, hours,  
 * days, or using epoch format. You may also set tokens to never expire.
 * More information here: https://docs.momentohq.com/develop/api-reference/auth-tokens#generateauthtoken-api
 */
export const tokenExpiresIn: ExpiresIn = ExpiresIn.hours(1);