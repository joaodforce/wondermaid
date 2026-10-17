import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseUids } from './uids';

describe('parseUids', () => {
  it('finds UIDs in any pasted format and drops duplicates', () => {
    assert.deepEqual(parseUids('700000001\n700000002, 1800000003;700000001\tuid: 600000004'), [
      '700000001',
      '700000002',
      '1800000003',
      '600000004',
    ]);
  });

  it('ignores numbers that are too short or too long', () => {
    assert.deepEqual(parseUids('12345678 12345678901 812345678'), ['812345678']);
  });
});
