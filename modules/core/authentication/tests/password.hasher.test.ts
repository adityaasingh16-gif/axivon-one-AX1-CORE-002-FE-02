/**
 * AXIVON ONE — Authentication Module (CORE-001)
 * Password hashing tests. Uses the real scrypt implementation.
 */

import { describe, expect, it } from 'vitest';
import { createScryptPasswordHasher } from '../backend/utils/password.hasher.js';

const hasher = createScryptPasswordHasher({
  // Small parameters keep this suite fast; the security property under test
  // (correct verification, salt uniqueness, format parsing) is unchanged.
  params: { N: 1024, r: 8, p: 1, keyLength: 32, saltLength: 16 },
});

describe('scrypt password hasher', () => {
  it('verifies the correct password and rejects an incorrect one', async () => {
    const hash = await hasher.hash('Sup3rSecret!');

    await expect(hasher.verify('Sup3rSecret!', hash)).resolves.toBe(true);
    await expect(hasher.verify('Sup3rSecret?', hash)).resolves.toBe(false);
  });

  it('never stores the plaintext password', async () => {
    const hash = await hasher.hash('Sup3rSecret!');

    expect(hash).not.toContain('Sup3rSecret!');
    expect(hash.startsWith('scrypt$')).toBe(true);
  });

  it('produces a different hash for the same password (unique salt)', async () => {
    const first = await hasher.hash('Sup3rSecret!');
    const second = await hasher.hash('Sup3rSecret!');

    expect(first).not.toBe(second);
    await expect(hasher.verify('Sup3rSecret!', second)).resolves.toBe(true);
  });

  it('fails closed on a malformed stored hash instead of throwing', async () => {
    for (const bad of ['', 'nonsense', 'scrypt$bad', 'bcrypt$N=1024$r=8$p=1$c2FsdA==$aGFzaA==']) {
      await expect(hasher.verify('Sup3rSecret!', bad)).resolves.toBe(false);
    }
  });

  it('fails closed when N is not a power of two', async () => {
    const bad = 'scrypt$N=1000$r=8$p=1$c2FsdHNhbHRzYWx0c2E=$aGFzaGhhc2hoYXNoaGFzaA==';
    await expect(hasher.verify('Sup3rSecret!', bad)).resolves.toBe(false);
  });

  it('dummyVerify completes without error (timing equalisation)', async () => {
    await expect(hasher.dummyVerify()).resolves.toBeUndefined();
  });
});
