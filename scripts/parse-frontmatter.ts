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

  if (!normalized.startsWith("---\n") && normalized !== "---") {
    return {
      frontmatter: null,
      body: normalized,
      hasFrontmatter: false,
    };
  }

  const endMarker = normalized.indexOf("\n---\n", 4);
  if (endMarker === -1) {
    return {
      frontmatter: null,
      body: normalized,
      hasFrontmatter: false,
    };
  }

  const yamlSource = normalized.slice(4, endMarker);
  const body = normalized.slice(endMarker + 5);
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
