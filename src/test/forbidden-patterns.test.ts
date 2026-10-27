import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Teste estático: garante que o código do frontend não contém padrões
 * proibidos pelas regras de segurança (.agents/rules/security.md).
 */
const ROOT = process.cwd(); // vitest roda a partir da raiz do projeto
const SCANNED_DIRS = ['src', 'public', 'index.html'];
const EXCLUDED = [join('src', 'test')];

const FORBIDDEN: Array<{ name: string; pattern: RegExp }> = [
  { name: 'dangerouslySetInnerHTML', pattern: /dangerouslySetInnerHTML/ },
  { name: 'innerHTML', pattern: /\.(inner|outer)HTML\s*=/ },
  { name: 'eval()', pattern: /\beval\s*\(/ },
  { name: 'new Function()', pattern: /new\s+Function\s*\(/ },
  { name: 'GEMINI_API_KEY', pattern: /GEMINI_API_KEY/ },
  { name: 'service role', pattern: /SERVICE_ROLE|service_role/ },
  { name: 'chave secreta Supabase', pattern: /sb_secret_/ },
  { name: 'chave Google', pattern: /AIza[0-9A-Za-z_-]{35}/ },
];

function collectFiles(path: string): string[] {
  const full = join(ROOT, path);
  if (EXCLUDED.some((ex) => path.startsWith(ex))) return [];
  if (statSync(full).isFile()) return [path];
  return readdirSync(full).flatMap((entry) => collectFiles(join(path, entry)));
}

describe('padrões proibidos no frontend', () => {
  const files = SCANNED_DIRS.flatMap(collectFiles);

  it('encontra arquivos para analisar', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const { name, pattern } of FORBIDDEN) {
    it(`não usa ${name}`, () => {
      const offenders = files.filter((file) => pattern.test(readFileSync(join(ROOT, file), 'utf8')));
      expect(offenders.map((f) => relative(ROOT, join(ROOT, f)))).toEqual([]);
    });
  }
});
