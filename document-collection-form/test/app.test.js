import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('React entry point is mounted by Vite HTML', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /src="\/src\/main\.tsx"/);
});

test('form includes required intake fields', () => {
  const app = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');

  [
    'requesterName',
    'requesterEmail',
    'clientName',
    'dueDate',
    'documents',
  ].forEach((fieldName) => {
    assert.match(app, new RegExp(`name="${fieldName}"`));
  });
});

test('application validates required document selection', () => {
  const app = fs.readFileSync(path.join(root, 'src', 'App.tsx'), 'utf8');

  assert.match(app, /form\.documents\.length === 0/);
  assert.match(app, /Select at least one document\./);
});
