import { parseDocument } from "yaml";

import {
  type SkillFrontmatter,
  SkillFrontmatterSchema,
} from "../src/skill-frontmatter.schema";

export interface ParsedFrontmatter {
  frontmatter: SkillFrontmatter | null;
  body: string;
  hasFrontmatter: boolean;
}

export function parseFrontmatter(markdown: string): ParsedFrontmatter {
  const normalized = markdown.replace(/^\uFEFF/, "");

  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) {
    return {
      frontmatter: null,
      body: normalized,
      hasFrontmatter: false,
    };
  }

  const yamlSource = match[1] ?? "";
  const body = normalized.slice(match[0].length);
  const document = parseDocument(yamlSource);

  if (document.errors.length > 0) {
    throw new Error(`Invalid YAML frontmatter: ${document.errors[0]?.message ?? "unknown error"}`);
  }

  const data = document.toJS();
  if (data == null || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("Frontmatter must be a YAML object");
  }

  return {
    frontmatter: SkillFrontmatterSchema.parse(data),
    body,
    hasFrontmatter: true,
  };
}
