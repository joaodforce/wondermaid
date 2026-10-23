import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { safeNext } from './redirect';

describe('safeNext', () => {
  it('keeps paths on this site', () => {
    assert.equal(safeNext('/team-showcase/submit?uid=700000001'), '/team-showcase/submit?uid=700000001');
    assert.equal(safeNext('/account#linked'), '/account#linked');
  });

  it('rejects anything that leaves the site', () => {
    for (const next of ['//evil.com', '/\\evil.com', '/\t/evil.com', '/\n/evil.com', 'https://evil.com', 'evil.com', '', null]) {
      assert.equal(safeNext(next), '/account', JSON.stringify(next));
    }
  });
});
