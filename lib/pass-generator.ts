import QRCode from 'qrcode';
import { getDb } from './db';
import { Pass } from './models/pass';

/**
 * Generate a pass ID in the format PREFIX-NNNN
 * @param prefix - The prefix for the pass ID (e.g., "VIS")
 * @param sequence - The sequence number (e.g., 1 for 0001)
 * @returns Pass ID string (e.g., "VIS-0001")
 */
export function generatePassId(prefix: string, sequence: number): string {
  const paddedSequence = sequence.toString().padStart(4, '0');
  return `${prefix}-${paddedSequence}`;
}

/**
 * Generate a QR code data URL for a pass
 * @param passId - The pass ID to encode in the QR code
 * @param baseUrl - The base URL for the verification page
 * @returns Promise resolving to QR code data URL
 */
export async function generateQRCode(passId: string, baseUrl: string): Promise<string> {
  const verificationUrl = `${baseUrl}/scan/${passId}`;
  const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
    width: 300,
    margin: 2,
    errorCorrectionLevel: 'M'
  });
  return qrDataUrl;
}

/**
 * Get the next available sequence number for a given prefix
 * @param prefix - The prefix to check
 * @returns Promise resolving to the next sequence number
 */
async function getNextSequence(prefix: string): Promise<number> {
  const db = await getDb();
  const passesCollection = db.collection<Pass>('passes');
  
  // Find the highest sequence number for this prefix
  const lastPass = await passesCollection
    .find({ passId: { $regex: `^${prefix}-` } })
    .sort({ passId: -1 })
    .limit(1)
    .toArray();
  
  if (lastPass.length === 0) {
    return 1;
  }
  
  // Extract the sequence number from the last pass ID
  const lastPassId = lastPass[0].passId;
  const sequencePart = lastPassId.split('-')[1];
  const lastSequence = parseInt(sequencePart, 10);
  
  return lastSequence + 1;
}

/**
 * Generate a batch of passes
 * @param config - Configuration for the batch
 * @returns Promise resolving to array of generated passes
 */
export async function generatePassBatch(config: {
  eventId: string;
  prefix: string;
  count: number;
  baseUrl: string;
}): Promise<Pass[]> {
  const { eventId, prefix, count, baseUrl } = config;
  
  if (count <= 0) {
    throw new Error('Count must be greater than 0');
  }
  
  if (!prefix || prefix.trim() === '') {
    throw new Error('Prefix is required');
  }
  
  const db = await getDb();
  const passesCollection = db.collection<Pass>('passes');
  
  // Get the starting sequence number
  const startSequence = await getNextSequence(prefix);
  
  // Generate all passes
  const passes: Pass[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const sequence = startSequence + i;
    const passId = generatePassId(prefix, sequence);
    const qrUrl = `${baseUrl}/scan/${passId}`;
    const qrDataUrl = await generateQRCode(passId, baseUrl);
    
    const pass: Pass = {
      passId,
      eventId,
      status: 'unused',
      qrUrl,
      qrDataUrl,
      createdAt: now,
      updatedAt: now
    };
    
    passes.push(pass);
  }
  
  // Check for duplicates before inserting
  const passIds = passes.map(p => p.passId);
  const existingPasses = await passesCollection
    .find({ passId: { $in: passIds } })
    .toArray();
  
  if (existingPasses.length > 0) {
    throw new Error(`Duplicate pass IDs detected: ${existingPasses.map(p => p.passId).join(', ')}`);
  }
  
  // Insert all passes in a single operation
  await passesCollection.insertMany(passes);
  
  return passes;
}

/**
 * Ensure indexes are created on the passes collection
 */
export async function ensurePassIndexes(): Promise<void> {
  const db = await getDb();
  const passesCollection = db.collection<Pass>('passes');
  
  // Create indexes
  await passesCollection.createIndex({ passId: 1 }, { unique: true });
  await passesCollection.createIndex({ eventId: 1 });
  await passesCollection.createIndex({ mobile: 1 });
  await passesCollection.createIndex({ status: 1 });
}
