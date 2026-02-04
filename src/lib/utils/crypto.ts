/**
 * Cryptographic Utilities
 *
 * Provides AES-256-GCM encryption for sensitive data like API keys.
 * Uses the Web Crypto API for secure, native encryption.
 *
 * Security notes:
 * - Key must be a 64-character hex string (32 bytes / 256 bits)
 * - Each encryption uses a random 96-bit IV
 * - GCM mode provides authenticated encryption (integrity + confidentiality)
 *
 * @module utils/crypto
 */

import { ENCRYPTION_KEY } from '$env/static/private';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12; // 96 bits for GCM

/**
 * Encrypts a plaintext string using AES-256-GCM
 *
 * @param plaintext - The string to encrypt
 * @returns Base64 encoded string containing IV + ciphertext + auth tag
 *
 * @example
 * ```ts
 * const encrypted = await encrypt('sk-abc123...');
 * // Store encrypted in database
 * ```
 */
export async function encrypt(plaintext: string): Promise<string> {
	const key = await getKey();
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encoder = new TextEncoder();
	const data = encoder.encode(plaintext);

	const encrypted = await crypto.subtle.encrypt(
		{ name: ALGORITHM, iv },
		key,
		data
	);

	// Combine IV + ciphertext into a single array
	const combined = new Uint8Array(iv.length + encrypted.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(encrypted), iv.length);

	// Return as base64
	return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts an AES-256-GCM encrypted string
 *
 * @param encrypted - Base64 encoded string containing IV + ciphertext + auth tag
 * @returns Decrypted plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 *
 * @example
 * ```ts
 * const apiKey = await decrypt(encryptedKey);
 * // Use apiKey for API call
 * ```
 */
export async function decrypt(encrypted: string): Promise<string> {
	const key = await getKey();

	// Decode from base64
	const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

	// Extract IV and ciphertext
	const iv = combined.slice(0, IV_LENGTH);
	const ciphertext = combined.slice(IV_LENGTH);

	const decrypted = await crypto.subtle.decrypt(
		{ name: ALGORITHM, iv },
		key,
		ciphertext
	);

	const decoder = new TextDecoder();
	return decoder.decode(decrypted);
}

/**
 * Derives a CryptoKey from the environment encryption key
 */
async function getKey(): Promise<CryptoKey> {
	if (!ENCRYPTION_KEY) {
		throw new Error('ENCRYPTION_KEY environment variable is not set');
	}

	// The key should be a 64-character hex string (32 bytes)
	if (ENCRYPTION_KEY.length !== 64) {
		throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
	}

	// Convert hex string to bytes
	const keyBytes = new Uint8Array(32);
	for (let i = 0; i < 32; i++) {
		keyBytes[i] = parseInt(ENCRYPTION_KEY.slice(i * 2, i * 2 + 2), 16);
	}

	return crypto.subtle.importKey(
		'raw',
		keyBytes,
		{ name: ALGORITHM },
		false,
		['encrypt', 'decrypt']
	);
}

/**
 * Generates a random encryption key (for initial setup)
 * @returns 64-character hex string suitable for ENCRYPTION_KEY env var
 */
export function generateEncryptionKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
