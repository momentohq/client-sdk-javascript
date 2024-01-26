import OpenAI from 'openai';
import * as https from 'https';
import {
  ALL_VECTOR_METADATA,
  CredentialProvider,
  PreviewVectorIndexClient,
  VectorIndexConfigurations,
  VectorSearch,
  VectorUpsertItemBatch,
} from '@gomomento/sdk';
import { CreateEmbeddingResponse } from "openai/resources";

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

const mviClient = new PreviewVectorIndexClient({
  credentialProvider: CredentialProvider.fromEnvironmentVariable({
    environmentVariableName: 'MOMENTO_API_KEY',
  }),
  configuration: VectorIndexConfigurations.Laptop.latest(),
});

interface WikipediaResponse {
  query: {
    pages: {
      [key: string]: {
        extract: string;
      };
    };
  };
}

async function getWikipediaExtract(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, response => {
      let data = '';
      response.on('data', chunk => {
        data += chunk;
      });
      response.on('end', () => {
        try {
          const jsonData: WikipediaResponse = JSON.parse(data);
          const pages = jsonData.query.pages;
          const extract = Object.values(pages)[0].extract;
          resolve(extract);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', error => {
      reject(error);
    });
  });
}

function splitTextIntoChunks(text: string, chunkSize = 600): string[] {
  const chunks = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.substring(i, i + chunkSize));
  }
  return chunks;
}

const url = "https://en.wikipedia.org/w/api.php?action=query&format=json&titles=Carrot&prop=extracts&explaintext";

async function generateEmbeddings(texts: string[]): Promise<CreateEmbeddingResponse> {
  return (await openai.embeddings.create({ input: texts, model: 'text-embedding-ada-002' }));
}

async function searchQuery(queryText: string): Promise<string[]> {
  const queryResponse = await openai.embeddings.create({ input: queryText, model: 'text-embedding-ada-002' });
  const queryVector = queryResponse.data[0].embedding;

  try {
    const searchResponse = await mviClient.search('mvi-demo-openai', queryVector, {
      topK: 2,
      metadataFields: ALL_VECTOR_METADATA
    });

    if (searchResponse instanceof VectorSearch.Success) {
      const texts: string[] = searchResponse.hits().map(hit => hit.metadata.text as string);
      return texts;
    } else if (searchResponse instanceof VectorSearch.Error) {
      console.error('Search error:', searchResponse.message());
    }
  } catch (error) {
    console.error('Unexpected error during search:', error);
  }

  return [];
}

async function upsertToMomentoVectorIndex(embeddingsResponse: CreateEmbeddingResponse, chunks: string[]) {
  const embeddings = embeddingsResponse.data.map(embedding => embedding.embedding);
  const ids = chunks.map((_, index) => `chunk${index + 1}`);
  const metadatas = chunks.map(chunk => ({ text: chunk }));
  const items = ids.map((id, index) => ({ id, vector: embeddings[index], metadata: metadatas[index] }));

  try {
    const upsertResponse = await mviClient.upsertItemBatch('mvi-demo-openai', items);
    if (upsertResponse instanceof VectorUpsertItemBatch.Success) {
      console.log('\n\nUpsert successful. Items have been stored.');
    } else if (upsertResponse instanceof VectorUpsertItemBatch.Error) {
      console.error('Upsert error:', upsertResponse.message);
    }
  } catch (error) {
    console.error('Unexpected error during upsert:', error);
  }
}

async function searchWithChatCompletion(texts: string[], queryText: string) {
  const text = texts.join('\n');
  const prompt: string = 'Given the following extracted parts about carrot, answer questions pertaining to' +
    " carrot only from the provided text. If you don't know the answer, just say that " +
    "you don't know. Don't try to make up an answer. Do not answer anything outside of the context given. " +
    "Your job is to only answer about carrots, and only from the text below. If you don't know the answer, just " +
    "say that you don't know. Here's the text:\n\n----------------\n\n";

  const resp = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: prompt + text },
      { role: 'user', content: queryText },
    ],
    model: 'gpt-3.5-turbo',
  });

  return resp;

}



async function main() {
  const extractText = await getWikipediaExtract(url);
  console.log('Total characters in carrot Wikipedia page :' + String(extractText.length));
  console.log('Sample text in carrot Wikipedia page:\n\n ' + extractText.substring(0, 500))
  const chunks = splitTextIntoChunks(extractText);

  console.log('Total number of chunks created: ' + String(chunks.length));
  console.log('Total characters in each chunk: ' + String(chunks[0].length));
  const embeddingsResponse = await generateEmbeddings(chunks);
  console.log('Length of each embedding: ' + String(embeddingsResponse.data[0].embedding.length));
  console.log('Sample embedding: ' + String(embeddingsResponse.data[0].embedding.slice(0, 10)));
  // await upsertToMomentoVectorIndex(embeddingsResponse, chunks);
  //
  // const query = 'how fast do fast-growing cultivators mature in carrots?';
  // const texts = await searchQuery(query);
  // if (texts.length > 0) {
  //   console.log('\n=========================================\n');
  //   console.log('Embedding search results:\n\n', texts[0]);
  //   console.log('\n=========================================\n');
  //
  //   const chatCompletionResp = await searchWithChatCompletion(texts, query);
  //
  //   console.log('\n=========================================\n');
  //   console.log('Chat completion search results:\n\n', chatCompletionResp.choices[0].message.content);
  //   console.log('\n=========================================\n');
  // }



  }


main().then(() => {}).catch(error => console.log(error));
