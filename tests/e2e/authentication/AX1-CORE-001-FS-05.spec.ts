import assert from 'node:assert/strict';
import test from 'node:test';

import { AuthenticationBackendService } from '../../../../modules/core/authentication/backend/index.js';

test('login should reject empty credentials', async () => {
  await assert.rejects(
    AuthenticationBackendService.authenticate({
      email: '',
      password: '',
    }),
    /Email and password required/,
  );
});

test('login should return authentication tokens', async () => {
  const result = await AuthenticationBackendService.authenticate({
    email: 'test@example.com',
    password: 'TestPassword123!',
  });

  assert.equal(result.accessToken, 'sample_jwt_access_token');
  assert.equal(result.refreshToken, 'sample_jwt_refresh_token');
  assert.equal(result.expiresIn, 3600);
});

test('session verification should reject an empty token', async () => {
  await assert.rejects(
    AuthenticationBackendService.verifySessionToken(''),
    /Token required/,
  );
});

test('session verification should return user details', async () => {
  const result =
    await AuthenticationBackendService.verifySessionToken(
      'sample_jwt_access_token',
    );

  assert.equal(result.email, 'admin@axivon.com');
  assert.equal(
    result.userId,
    '00000000-0000-0000-0000-000000000001',
  );
});
