/**
 * Backend unit tests for reusable Fabuloso database utility functions.
 *
 * These tests do not connect to or modify the student's live MongoDB database.
 * They test standalone helper functions imported from database.js using Node.js's built-in testing and assertion modules.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ageFromDob,
  publicUser
} = require('../database');

/**
 * Verify that ageFromDob() safely rejects an invalid date of birth.
 *
 * An invalid date should return null rather than producing an incorrect age or throwing an unexpected error.
 */
test('ageFromDob rejects invalid dates', () => {
  assert.equal(
    ageFromDob('not-a-date'),
    null
  );
});

/**
 * Verify that ageFromDob() calculates a numeric age for a valid historical date of birth.
 *
 * The test checks:
 * - The returned value has the JavaScript type "number".
 * - A person born on 1 January 2000 has reached at least age 25.
 *
 * Using a lower-bound assertion avoids unnecessarily tying the test to one exact calendar year.
 */
test('ageFromDob calculates the expected minimum age for a past DOB', () => {
  const age = ageFromDob('2000-01-01');

  assert.equal(typeof age, 'number');
  assert.ok(age >= 25);
});

/**
 * Verify that publicUser() removes sensitive/internal database fields before user information is returned to a client.
 *
 * password:
 *   Must not appear in the sanitised result because password hashes or credentials must never be exposed through API responses.
 *
 * _id:
 *   MongoDB's internal identifier is removed because Fabuloso uses its own application-level id field.
 *
 * id:
 *   Must remain available because it is the application's public identifier for the user.
 */
test('publicUser removes password and MongoDB internal id', () => {
  const safe = publicUser({
    id: 'abc',
    username: 'user',
    password: 'secret',
    _id: 'mongo'
  });

  // Confirm that legitimate public user information remains available.
  assert.equal(safe.id, 'abc');

  // Confirm that sensitive and internal database fields were removed.
  assert.equal(safe.password, undefined);
  assert.equal(safe._id, undefined);
});