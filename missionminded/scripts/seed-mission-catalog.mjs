import { createSign } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dataPath = fileURLToPath(new URL('../src/data/mission-catalog.json', import.meta.url));
const dataset = JSON.parse(await readFile(dataPath, 'utf8'));
const entries = dataset.entries;
const apply = process.argv.includes('--apply');
const expectedCount = 505;

if (!Array.isArray(entries) || dataset.extractedCount !== expectedCount || entries.length !== expectedCount) {
  throw new Error('Mission catalog snapshot failed its recorded-count check.');
}

const ids = new Set(entries.map((entry) => entry.id));
if (ids.size !== entries.length || entries.some((entry) => !entry.id || !entry.name || !entry.region)) {
  throw new Error('Mission catalog contains duplicate IDs or incomplete entries.');
}

if (!apply) {
  console.log(`Dry run: ${entries.length} mission records are ready; no database writes made.`);
  if (dataset.declaredCount !== entries.length) {
    console.log(`Article states ${dataset.declaredCount}; using the ${entries.length} names in its list, as approved.`);
  }
  console.log('Pass --apply to write these records using admin credentials.');
  process.exit(0);
}

if (entries.length !== expectedCount) {
  throw new Error(`Refusing to write: expected ${expectedCount} names, found ${entries.length}.`);
}

const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const projectId = process.env.FIRESTORE_PROJECT_ID;
if (!credentialPath || !projectId) {
  throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS and FIRESTORE_PROJECT_ID in the current shell.');
}

const credentials = JSON.parse(await readFile(credentialPath, 'utf8'));
if (credentials.project_id !== projectId || !credentials.client_email || !credentials.private_key) {
  throw new Error('Admin credentials do not match FIRESTORE_PROJECT_ID or are incomplete.');
}

function base64Url(value) {
  return Buffer.from(value).toString('base64url');
}

function createAssertion() {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  return `${unsigned}.${signer.sign(credentials.private_key).toString('base64url')}`;
}

async function getAccessToken() {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: createAssertion(),
    }),
  });
  if (!response.ok) throw new Error(`Google token request failed (${response.status}).`);
  const result = await response.json();
  if (typeof result.access_token !== 'string') throw new Error('Google token response did not include an access token.');
  return result.access_token;
}

function firestoreValue(value) {
  return { stringValue: value };
}

const token = await getAccessToken();
const database = `projects/${projectId}/databases/(default)`;
const endpoint = `https://firestore.googleapis.com/v1/${database}/documents:commit`;
const fieldsToUpdate = ['name', 'sourceName', 'region'];

for (let offset = 0; offset < entries.length; offset += 400) {
  const batch = entries.slice(offset, offset + 400);
  const writes = batch.map((entry) => ({
    update: {
      name: `${database}/documents/missions/${entry.id}`,
      fields: {
        name: firestoreValue(entry.name),
        sourceName: firestoreValue(entry.sourceName),
        region: firestoreValue(entry.region),
      },
    },
    updateMask: { fieldPaths: fieldsToUpdate },
  }));
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ writes }),
  });
  if (!response.ok) throw new Error(`Firestore write failed for batch at offset ${offset} (${response.status}).`);
}

console.log(`Seeded ${entries.length} mission names into Firestore collection missions.`);
