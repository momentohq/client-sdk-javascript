import {AllDataReadWrite, TopicRole, CacheRole, ExpiresIn, TokenScope, AllTopics, AllCaches, TokenScopes} from '@gomomento/sdk';

/**
 * Set the scope of permissions for your tokens. 
 * 
 * AllDataReadWrite provides read and write permissions to all of your caches:
 *    export const tokenPermissions: TokenScope =  AllDataReadWrite;
 * 
 * TokenScopes provides several functions that will return the permissions you
 * request for a given cache and topic name.
 *    export const tokenPermissions: TokenScope = TokenScopes.topicPublishSubscribe("default-cache", AllTopics);
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

/**
 * Set the authentication method for the token vending machine to protect against
 * unauthorized users. The options provided correspond to the example authorizers:
 *    - "open": no authentication
 *    - "lambda-authorizer": uses a Lambda Authorizer attached to the API Gateway endpoint
 *    - "amazon-cognito": uses an Amazon Cognito user pool as an authorizer
 * 
 * When using Amazon Cognito, you'll need to first sign into Cognito to get an ID
 * token that you'll include in your requests to the Token Vending Machine API. 
 */
export const authenticationMethod: string = "open";