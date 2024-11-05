# Node.js クライアント SDK

_他言語バージョンもあります_：[English](README.md)

<br>

## SDK のコード例を実行する

- Node バージョン 16 もしくはそれ以上
- Momento オーストークンが必要です。トークン発行は[Momento CLI](https://github.com/momentohq/momento-cli)から行えます。

```bash
cd examples
npm install

# SDKコード例を実行する
MOMENTO_API_KEY=<YOUR API KEY> npm run example
```

SDK コード例: [index.ts](index.ts)

## SDK を自身のプロジェクトで使用する

### インストール方法

```bash
npm install @gomomento/sdk
```

### 使用方法

```typescript
import { CacheClient, CacheGetStatus } from "@gomomento/sdk";

// ユーザーのMomentoオーストークン
const apiKey = process.env.MOMENTO_API_KEY;

//  Momentoをイニシャライズする
const DEFAULT_TTL = 60; // デフォルトTTLは60秒
const momento = new CacheClient(apiKey, DEFAULT_TTL);

// "myCache"という名のキャッシュを作成する
const CACHE_NAME = "myCache";
await momento.createCache(CACHE_NAME);

// デフォルトTTLでキーを設定
await momento.set(CACHE_NAME, "key", "value");
const res = await momento.get(CACHE_NAME, "key");
console.log("result: ", res.text());

// TTL５秒でキーを設定
await momento.set(CACHE_NAME, "key2", "value2", 5);

// 永久にキャッシュを削除する
await momento.deleteCache(CACHE_NAME);
```

Momento はバイト型のストアもサポートしています

```typescript
const key = new Uint8Array([109, 111, 109, 101, 110, 116, 111]);
const value = new Uint8Array([
  109, 111, 109, 101, 110, 116, 111, 32, 105, 115, 32, 97, 119, 101, 115, 111,
  109, 101, 33, 33, 33,
]);
await momento.set("cache", key, value, 50);
await momento.get("cache", key);
```

キャッシュミスの対応

```typescript
const res = await momento.get("cache", "non-existent key");
if (res.status === CacheGetStatus.Miss) {
  console.log("cache miss");
}
```

ファイルのストア

```typescript
const buffer = fs.readFileSync("./file.txt");
const filebytes = Uint8Array.from(buffer);
const cacheKey = "key";
const cacheName = "my example cache";

// キャッシュにファイルをストアする
await momento.set(cacheName, cacheKey, filebytes);

// ファイルをキャッシュから取り出す
const getResp = await momento.get(cacheName, cacheKey);

// ファイルをディスクに書き込む
fs.writeFileSync("./file-from-cache.txt", Buffer.from(getResp.bytes()));
```
