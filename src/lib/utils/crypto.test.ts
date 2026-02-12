import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, generateEncryptionKey } from './crypto';

describe('Crypto Utilities', () => {
	describe('encrypt / decrypt roundtrip', () => {
		it('should encrypt and decrypt a plaintext string', async () => {
			const plaintext = 'sk-abc123-my-secret-api-key';
			const encrypted = await encrypt(plaintext);
			const decrypted = await decrypt(encrypted);
			expect(decrypted).toBe(plaintext);
		});

		it('should handle empty strings', async () => {
			const encrypted = await encrypt('');
			const decrypted = await decrypt(encrypted);
			expect(decrypted).toBe('');
		});

		it('should handle unicode content', async () => {
			const plaintext = 'Hello World 你好世界';
			const encrypted = await encrypt(plaintext);
			const decrypted = await decrypt(encrypted);
			expect(decrypted).toBe(plaintext);
		});

		it('should produce different ciphertexts for same plaintext (random IV)', async () => {
			const plaintext = 'same-input-different-output';
			const encrypted1 = await encrypt(plaintext);
			const encrypted2 = await encrypt(plaintext);
			expect(encrypted1).not.toBe(encrypted2);

			// Both should decrypt to the same value
			expect(await decrypt(encrypted1)).toBe(plaintext);
			expect(await decrypt(encrypted2)).toBe(plaintext);
		});
	});

	describe('tampered ciphertext', () => {
		it('should throw when ciphertext is tampered', async () => {
			const encrypted = await encrypt('sensitive-data');

			// Tamper with the ciphertext by flipping a character near the end
			const chars = encrypted.split('');
			const idx = chars.length - 3;
			chars[idx] = chars[idx] === 'A' ? 'B' : 'A';
			const tampered = chars.join('');

			await expect(decrypt(tampered)).rejects.toThrow();
		});
	});

	describe('generateEncryptionKey', () => {
		it('should produce a 64-character hex string', () => {
			const key = generateEncryptionKey();
			expect(key).toHaveLength(64);
			expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
		});

		it('should produce unique keys', () => {
			const keys = new Set(Array.from({ length: 50 }, () => generateEncryptionKey()));
			expect(keys.size).toBe(50);
		});
	});
});
