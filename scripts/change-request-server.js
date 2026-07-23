const http = require('http');
const fs = require('fs');
const path = require('path');

const port = Number(process.env.CR_PORT || 8787);
const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'change-requests');

function send(res, statusCode, body) {
  const payload = JSON.stringify(body, null, 2);
  res.writeHead(statusCode, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function slugify(value) {
  return String(value || 'change-request')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'change-request';
}

function list(value) {
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => `- ${item}`).join('\n') : '- Not specified';
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => `- ${item}`)
      .join('\n');
  }
  return '- Not specified';
}

function markdownFor(body) {
  const title = body.title || 'Untitled change request';
  const receivedAt = new Date().toISOString();

  return `# ${title}

## Metadata

- Requester: ${body.requester || 'Not specified'}
- Priority: ${body.priority || 'Normal'}
- Received At: ${receivedAt}

## Goal

${body.description || body.goal || 'Not specified'}

## Requirements

${list(body.requirements)}

## Acceptance Criteria

${list(body.acceptance_criteria || body.acceptanceCriteria)}

## Suggested Files

${list(body.files)}

## Notes

${body.notes || 'Not specified'}
`;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1024 * 1024) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    send(res, 200, { ok: true });
    return;
  }

  if (req.method !== 'POST' || req.url !== '/change-request') {
    send(res, 404, {
      ok: false,
      message: 'Use POST /change-request',
    });
    return;
  }

  try {
    const raw = await readBody(req);
    const body = JSON.parse(raw || '{}');

    if (!body.title && !body.description && !body.goal) {
      send(res, 400, {
        ok: false,
        message: 'Provide at least title, description, or goal',
      });
      return;
    }

    fs.mkdirSync(outDir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${stamp}_${slugify(body.title || body.goal)}.md`;
    const filePath = path.join(outDir, filename);
    fs.writeFileSync(filePath, markdownFor(body), 'utf8');

    send(res, 201, {
      ok: true,
      file: path.relative(root, filePath).replace(/\\/g, '/'),
      next: 'If the automatic worker is running, Codex will process this request. Otherwise ask Codex to read the latest change request and implement it.',
    });
  } catch (error) {
    send(res, 400, {
      ok: false,
      message: error.message,
    });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Change request intake listening on http://127.0.0.1:${port}`);
  console.log(`POST JSON to http://127.0.0.1:${port}/change-request`);
});
