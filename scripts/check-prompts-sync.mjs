import { readFileSync, readdirSync, statSync } from 'fs';
import path from 'path';

const rootDir = path.resolve('resources/prompts/alain-kit');
const packageDir = path.resolve('packages/alain-kit/resources/prompts/alain-kit');

function collectFiles(baseDir) {
  const files = new Map();

  function walk(currentDir) {
    for (const entry of readdirSync(currentDir)) {
      if (entry === '.DS_Store') continue;
      const fullPath = path.join(currentDir, entry);
      const relPath = path.relative(baseDir, fullPath);
      const stats = statSync(fullPath);
      if (stats.isDirectory()) {
        walk(fullPath);
      } else if (stats.isFile()) {
        files.set(relPath, readFileSync(fullPath));
      }
    }
  }

  walk(baseDir);
  return files;
}

function assertExists(dir, label) {
  try {
    statSync(dir);
  } catch {
    console.error(`${label} directory not found: ${dir}`);
    process.exit(1);
  }
}

function checkSync() {
  assertExists(rootDir, 'Root prompt');
  assertExists(packageDir, 'Package prompt');

  const rootFiles = collectFiles(rootDir);
  const packageFiles = collectFiles(packageDir);

  const mismatches = [];

  for (const [relPath, content] of rootFiles) {
    if (!packageFiles.has(relPath)) {
      mismatches.push(`Missing in package prompts: ${relPath}`);
      continue;
    }
    if (Buffer.compare(content, packageFiles.get(relPath)) !== 0) {
      mismatches.push(`Content mismatch for ${relPath}`);
    }
  }

  for (const relPath of packageFiles.keys()) {
    if (!rootFiles.has(relPath)) {
      mismatches.push(`Missing in root prompts: ${relPath}`);
    }
  }

  if (mismatches.length) {
    console.error('Prompt sync check failed:\n' + mismatches.join('\n'));
    process.exit(1);
  }

  console.log('Prompt templates are in sync ✅');
}

checkSync();
