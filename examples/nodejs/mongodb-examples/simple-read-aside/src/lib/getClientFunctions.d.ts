import { CacheClient } from '@gomomento/sdk';
export declare function GetToken(secretName: string, regionName?: string): Promise<string>;
export default function CreateCacheClient(ttl?: number, tokenName?: string): Promise<CacheClient>;
