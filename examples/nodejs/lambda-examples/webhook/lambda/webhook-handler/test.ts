import * as crypto from "crypto";

const body = '{"cache":"cache","topic":"events","event_timestamp":1706586978582,"publish_timestamp":1706586978583,"topic_sequence_number":1,"token_id":"pratik","text":"{\\"comment\\":\\"This course and video is awesome!\\",\\"courseId\\":123}"}'
const hash = crypto.createHmac('SHA3-256', '9d0974b9-860d-4947-b1cc-6220ce7247f8');
const hashed = hash.update(body).digest('hex');

console.log('actual', hashed);
