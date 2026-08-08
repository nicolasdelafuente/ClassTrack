import { BadRequestException } from '@nestjs/common';

const MAX_LINKS = 8;
const MAX_URL_LENGTH = 500;

/**
 * Normalize optional Trello (or related) card URLs for a sprint-sheet task.
 * Accepts string[] or JSON-ish input; returns a clean unique list.
 */
export function normalizeTrelloLinks(raw: unknown): string[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [raw];
    } catch {
      list = raw
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  const out: string[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    if (typeof item !== 'string') continue;
    const url = item.trim();
    if (!url) continue;
    if (url.length > MAX_URL_LENGTH) {
      throw new BadRequestException(
        `El link es demasiado largo (máx. ${MAX_URL_LENGTH} caracteres)`,
      );
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new BadRequestException(`Link inválido: ${url}`);
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new BadRequestException(`El link debe ser http(s): ${url}`);
    }
    const normalized = parsed.toString();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(normalized);
    if (out.length > MAX_LINKS) {
      throw new BadRequestException(
        `Máximo ${MAX_LINKS} links de Trello por tarea`,
      );
    }
  }

  return out;
}

/** Read Json / unknown from Prisma into string[]. */
export function readTrelloLinks(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string');
}
