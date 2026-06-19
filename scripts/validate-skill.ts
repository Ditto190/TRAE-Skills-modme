import { ZodError } from "zod";

import {
  type SkillCatalog,
  type SkillIndex,
  type SkillRecord,
  SkillCatalogSchema,
  SkillIndexSchema,
  SkillRecordSchema,
} from "../src/skill-frontmatter.schema";

function formatZodError(prefix: string, error: ZodError): string {
  const issues = error.issues
    .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.message}`)
    .join("; ");

  return `${prefix}: ${issues}`;
}

export function validateSkill(skill: unknown): SkillRecord {
  try {
    return SkillRecordSchema.parse(skill);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatZodError("Invalid skill record", error));
    }
    throw error;
  }
}

export function validateCatalog(catalog: unknown): SkillCatalog {
  try {
    return SkillCatalogSchema.parse(catalog);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatZodError("Invalid skill catalog", error));
    }
    throw error;
  }
}

export function validateIndex(index: unknown): SkillIndex {
  try {
    return SkillIndexSchema.parse(index);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new Error(formatZodError("Invalid skill index", error));
    }
    throw error;
  }
}
