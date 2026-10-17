#!/usr/bin/env node
// Computes the next release version from Conventional Commits since the last `vX.Y.Z` tag:
//   BREAKING CHANGE: / type!:  -> major
//   feat:                      -> minor
//   anything else              -> patch
// Usage: node scripts/release-version.mjs [--current]
//   --current  report the version in package.json without bumping (used for master builds)
// Prints key=value lines and appends them to $GITHUB_OUTPUT when set.
import { execFileSync } from 'node:child_process';
import { appendFileSync, readFileSync } from 'node:fs';

const SEMVER = /^v?(\d+)\.(\d+)\.(\d+)$/;
const TAG_GLOB = 'v[0-9]*.[0-9]*.[0-9]*';
const RELEASE_COMMIT = /^chore\(release\):/;

const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const tryGit = (...args) => {
  try {
    return git(...args);
  } catch {
    return '';
  }
};

function parse(version) {
  const match = SEMVER.exec(version);
  if (!match) throw new Error(`Not a plain semver version: ${version}`);
  return match.slice(1, 4).map(Number);
}

const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

export function bumpType(messages) {
  let bump = 'patch';
  for (const message of messages) {
    if (RELEASE_COMMIT.test(message)) continue;
    const lines = message.split('\n').map((line) => line.trim());
    // Merge commits carry the PR title in the body, so check every line, not just the subject
    if (lines.some((line) => /^BREAKING[ -]CHANGE:/.test(line) || /^[a-z]+(\([^)]*\))?!:/i.test(line))) return 'major';
    if (lines.some((line) => /^feat(\([^)]*\))?:/i.test(line))) bump = 'minor';
  }
  return bump;
}

export function increment([major, minor, patch], bump) {
  if (bump === 'major') return `${major + 1}.0.0`;
  if (bump === 'minor') return `${major}.${minor + 1}.0`;
  return `${major}.${minor}.${patch + 1}`;
}

function main() {
  const pkgVersion = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;
  let result;

  const headTag = tryGit('tag', '--points-at', 'HEAD', '--list', TAG_GLOB).split('\n').find(Boolean);
  if (process.argv.includes('--current')) {
    result = { version: parse(pkgVersion).join('.'), previous: '', bump: 'none', release: 'false' };
  } else if (headTag) {
    // Re-run of an already released commit: rebuild the same version
    result = { version: parse(headTag).join('.'), previous: '', bump: 'none', release: 'false' };
  } else {
    const lastTag = tryGit('describe', '--tags', '--abbrev=0', '--match', TAG_GLOB);
    // Bump from whichever is higher, so a manual package.json bump is respected
    const candidates = [parse(pkgVersion), ...(lastTag ? [parse(lastTag)] : [])];
    const base = candidates.sort(compare).at(-1);
    const range = lastTag ? `${lastTag}..HEAD` : 'HEAD';
    const messages = git('log', '--format=%B%x00', range).split('\0').map((m) => m.trim()).filter(Boolean);
    const bump = bumpType(messages);
    result = { version: increment(base, bump), previous: lastTag || `v${base.join('.')}`, bump, release: 'true' };
  }

  const lines = Object.entries(result).map(([key, value]) => `${key}=${value}`);
  console.log(lines.join('\n'));
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join('\n')}\n`);
}

main();
