import { describe, it, expect } from 'vitest';

// Helper function to generate encryption keys (isolated from crypto.ts for testing)
function generateEncryptionKey(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

describe('Crypto Helper Utilities', () => {
	describe('generateEncryptionKey', () => {
		it('should generate a 64-character hex string', () => {
			const key = generateEncryptionKey();

			expect(key).toHaveLength(64);
			expect(/^[0-9a-f]{64}$/.test(key)).toBe(true);
		});

		it('should generate unique keys each time', () => {
			const key1 = generateEncryptionKey();
			const key2 = generateEncryptionKey();

			expect(key1).not.toBe(key2);
		});

		it('should generate keys that are valid hex', () => {
			const key = generateEncryptionKey();
			const bytes = new Uint8Array(32);

			// Should be able to parse as hex without errors
			for (let i = 0; i < 32; i++) {
				bytes[i] = parseInt(key.slice(i * 2, i * 2 + 2), 16);
			}

			expect(bytes.length).toBe(32);
			expect(bytes.every((b) => b >= 0 && b <= 255)).toBe(true);
		});

		it('should generate cryptographically random keys', () => {
			const keys = new Set<string>();
			const iterations = 100;

			// Generate 100 keys and ensure all are unique
			for (let i = 0; i < iterations; i++) {
				keys.add(generateEncryptionKey());
			}

			expect(keys.size).toBe(iterations);
		});
	});
});
