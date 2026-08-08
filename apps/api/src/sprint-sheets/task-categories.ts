import { BadRequestException } from '@nestjs/common';
import { TASK_CATEGORIES } from './dto/sprint-sheets.dto';

const ALLOWED = new Set<string>(TASK_CATEGORIES);

/**
 * Normalize optional task tags (categories). Accepts string[] or a legacy
 * single `category` string. Empty list is valid (tags are optional).
 */
export function normalizeCategories(
  raw: unknown,
  legacyCategory?: unknown,
): string[] {
  let list: unknown[] = [];

  if (Array.isArray(raw)) {
    list = raw;
  } else if (typeof raw === 'string' && raw.trim()) {
    try {
      const parsed: unknown = JSON.parse(raw);
      list = Array.isArray(parsed) ? parsed : [raw];
    } catch {
      list = [raw];
    }
  } else if (typeof legacyCategory === 'string' && legacyCategory.trim()) {
    list = [legacyCategory];
  }

  const out: string[] = [];
  const seen = new Set<string>();

  for (const item of list) {
    if (typeof item !== 'string') continue;
    const value = item.trim();
    if (!value) continue;
    if (!ALLOWED.has(value)) {
      throw new BadRequestException(`Tag inválido: ${value}`);
    }
    if (seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }

  return out;
}

/** Read Json / unknown from Prisma into validated string[]. */
export function readCategories(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const item of raw) {
    if (typeof item !== 'string') continue;
    if (!ALLOWED.has(item)) continue;
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}
