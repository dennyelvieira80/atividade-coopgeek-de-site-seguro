#!/usr/bin/env node
/**
 * Verifica se o bundle publicado (dist/) contém segredos.
 * Uso: npm run build && npm run check:secrets
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';

if (!existsSync(DIST)) {
  console.error('dist/ não encontrado. Rode "npm run build" antes.');
  process.exit(2);
}

const PATTERNS = [
  { name: 'Nome GEMINI_API_KEY', regex: /GEMINI_API_KEY/g },
  { name: 'Nome SUPABASE_SERVICE_ROLE_KEY', regex: /SUPABASE_SERVICE_ROLE_KEY/g },
  { name: 'Chave secreta Supabase (sb_secret_)', regex: /sb_secret_[A-Za-z0-9_-]{10,}/g },
  { name: 'Chave de API Google (AIza...)', regex: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'Chave privada PEM', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
];

const JWT_RE = /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

function walk(dir) {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

function jwtRole(token) {
  try {
    const payload = token.split('.')[1];
    const json = Buffer.from(payload, 'base64url').toString('utf8');
    return JSON.parse(json).role;
  } catch {
    return undefined;
  }
}

const findings = [];

for (const file of walk(DIST)) {
  if (!/\.(js|mjs|css|html|json|map|txt)$/.test(file)) continue;
  const content = readFileSync(file, 'utf8');

  for (const { name, regex } of PATTERNS) {
    if (content.match(regex)) findings.push(`${file}: ${name}`);
  }

  for (const token of content.match(JWT_RE) ?? []) {
    const role = jwtRole(token);
    if (role && role !== 'anon') findings.push(`${file}: JWT com role "${role}"`);
  }

  if (file.endsWith('.map')) findings.push(`${file}: source map publicado`);
}

if (findings.length > 0) {
  console.error('❌ Possíveis segredos no bundle:\n' + findings.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

console.log('✅ Nenhum segredo encontrado em dist/.');
