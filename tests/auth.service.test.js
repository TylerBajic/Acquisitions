import test from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, comparePassword } from '../src/services/auth.service.js';

test('comparePassword validates a hashed password', async () => {
  const hashedPassword = await hashPassword('supersecret');

  assert.equal(await comparePassword('supersecret', hashedPassword), true);
  assert.equal(await comparePassword('wrongpassword', hashedPassword), false);
});
