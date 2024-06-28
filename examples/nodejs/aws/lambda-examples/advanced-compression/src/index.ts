import { Context, APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import {execSync} from 'child_process';
import {
    CacheClient,
    Configurations,
    MomentoLoggerFactory,
    DefaultMomentoLoggerFactory,
    DefaultMomentoLoggerLevel,
    CompressionLevel,
    EnvMomentoTokenProvider,
} from '@gomomento/sdk';
import {CompressorFactory} from "@gomomento/sdk-nodejs-compression-zstd";

const cacheName = 'cache';
const cacheKey = 'key';
const cacheValue = 'value';

const credentialsProvider = new EnvMomentoTokenProvider({
    environmentVariableName: 'MOMENTO_API_KEY',
});

const loggerFactory: MomentoLoggerFactory = new DefaultMomentoLoggerFactory(DefaultMomentoLoggerLevel.INFO);

const config = Configurations.InRegion.Default.latest(loggerFactory).withCompressionStrategy({
    compressorFactory: CompressorFactory.default(),
    compressionLevel: CompressionLevel.SmallestSize,
});

const defaultTtl = 60;
const momento = new CacheClient({
    configuration: config,
    credentialProvider: credentialsProvider,
    defaultTtlSeconds: defaultTtl,
});

export const handler = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const setResp = await momento.set(cacheName, cacheKey, cacheValue, { compress: true });
    console.log(`set resp: ${setResp}`);
    const resp = await momento.get(cacheName, cacheKey, { decompress: true });
    console.log(`unary resp: ${resp}`);

    execSync('ls -lah', {
        stdio: 'inherit',
    });

    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'success',
        }),
    };
};
