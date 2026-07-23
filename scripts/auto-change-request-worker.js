const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const requestDir = path.join(root, 'change-requests');
const stateFile = path.join(requestDir, '.auto-worker-state.json');
const pollMs = Number(process.env.CR_WORKER_POLL_MS || 5000);
const runOnce = process.argv.includes('--once');
const autoPush = process.env.CR_AUTO_PUSH === '1';

let running = false;

function loadState() {
  try {
    return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  } catch {
    const requests = listRequests().map((file) => path.basename(file));
    return { processed: requests.slice(0, -1) };
  }
}

function saveState(state) {
  fs.mkdirSync(requestDir, { recursive: true });
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), 'utf8');
}

function listRequests() {
  if (!fs.existsSync(requestDir)) {
    return [];
  }

  return fs
    .readdirSync(requestDir)
    .filter((file) => file.endsWith('.md') && file !== 'README.md')
    .sort()
    .map((file) => path.join(requestDir, file));
}

function suggestedFilesFor(requestFile) {
  const content = fs.readFileSync(requestFile, 'utf8');
  const match = content.match(/## Suggested Files\s+([\s\S]*?)(?:\n## |\s*$)/);
  if (!match) {
    return [];
  }

  return match[1]
    .split(/\r?\n/)
    .map((line) => line.trim().replace(/^- /, '').trim())
    .filter((line) => line && line !== 'Not specified');
}

function hasOverlap(left, right) {
  if (left.length === 0 || right.length === 0) {
    return false;
  }

  const rightSet = new Set(right.map((item) => item.toLowerCase()));
  return left.some((item) => rightSet.has(item.toLowerCase()));
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: false,
      stdio: 'inherit',
      ...options,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

function quoteForPrompt(filePath) {
  return path.relative(root, filePath).replace(/\\/g, '/');
}

async function commitAndPush(requestFile) {
  const subject = path
    .basename(requestFile, '.md')
    .replace(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z_/, '')
    .replace(/-/g, ' ')
    .trim();

  await run('git', ['add', '.']);
  await run('git', ['commit', '-m', `Implement change request: ${subject || 'request'}`]);
  await run('git', ['push']);
}

async function processRequest(requestFile) {
  const relativePath = quoteForPrompt(requestFile);
  const prompt = [
    `Read ${relativePath} and implement it in this repository.`,
    'Keep the change scoped to the request.',
    'Follow AGENTS.md.',
    'Add or update tests when behavior changes.',
    'Run relevant checks before finishing.',
    autoPush
      ? 'Do not commit or push; the worker will handle git after you finish.'
      : 'Do not commit or push unless explicitly requested.',
  ].join('\n');

  console.log(`Processing ${relativePath}`);
  await run('codex', ['exec', '--cd', root, '--sandbox', 'workspace-write', prompt]);

  if (autoPush) {
    await commitAndPush(requestFile);
  }
}

async function tick() {
  if (running) {
    return;
  }

  running = true;
  const state = loadState();
  const processed = new Set(state.processed || []);
  const skipped = new Set(state.skipped || []);

  try {
    const requests = listRequests();
    const pending = requests.filter((file) => !processed.has(path.basename(file)) && !skipped.has(path.basename(file)));
    const superseded = new Set();

    pending.forEach((request, index) => {
      const files = suggestedFilesFor(request);
      const newerOverlappingRequest = pending.slice(index + 1).find((candidate) => hasOverlap(files, suggestedFilesFor(candidate)));
      if (newerOverlappingRequest) {
        superseded.add(path.basename(request));
        console.log(`Skipping ${quoteForPrompt(request)} because a newer request targets the same file.`);
      }
    });

    superseded.forEach((file) => skipped.add(file));

    const next = pending.find((file) => !superseded.has(path.basename(file)));
    if (!next) {
      saveState({
        processed: Array.from(processed).sort(),
        skipped: Array.from(skipped).sort(),
        lastCheckedAt: new Date().toISOString(),
      });

      if (runOnce) {
        console.log('No unprocessed change requests found.');
      }
      return;
    }

    await processRequest(next);
    processed.add(path.basename(next));
    saveState({
      processed: Array.from(processed).sort(),
      skipped: Array.from(skipped).sort(),
      lastProcessedAt: new Date().toISOString(),
    });
    console.log(`Completed ${quoteForPrompt(next)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    running = false;
  }
}

console.log(`Change request worker watching ${requestDir}`);
console.log(`Auto push is ${autoPush ? 'enabled' : 'disabled'}`);

tick().then(() => {
  if (!runOnce) {
    setInterval(tick, pollMs);
  }
});
