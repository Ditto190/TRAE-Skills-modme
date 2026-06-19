import path from "node:path";

import type { ReadmeSkillEntry } from "./parse-readme-table";
import type { ParsedFrontmatter } from "./parse-frontmatter";
import {
  type SkillRecord,
  defaultCompatibleAgents,
} from "../src/skill-frontmatter.schema";

interface MetadataEntry {
  id: string;
  name: string;
  category: string;
  tags?: string[];
}

interface InferSkillMetadataOptions {
  relativePath: string;
  markdownBody: string;
  parsedFrontmatter: ParsedFrontmatter;
  metadataEntry?: MetadataEntry;
  readmeEntry?: ReadmeSkillEntry;
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function stripSkillPrefix(value: string): string {
  return value.replace(/^#\s*Skill:\s*/i, "").replace(/^Skill:\s*/i, "").trim();
}

function titleFromId(id: string): string {
  return id
    .replace(/\.md$/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readHeading(markdownBody: string): string | undefined {
  const match = markdownBody.match(/^#\s+(.+)$/m);
  return match ? normalizeWhitespace(stripSkillPrefix(match[1])) : undefined;
}

function extractSection(markdownBody: string, headings: string[]): string | undefined {
  const headingSet = new Set(headings.map((heading) => heading.toLowerCase()));
  const lines = markdownBody.split(/\r?\n/);
  const collected: string[] = [];
  let capture = false;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      const normalizedHeading = normalizeWhitespace(headingMatch[1]).toLowerCase();
      if (capture) {
        break;
      }

      capture = headingSet.has(normalizedHeading);
      continue;
    }

    if (capture) {
      collected.push(line);
    }
  }

  const text = collected
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter(Boolean)
    .join(" ");

  return text ? normalizeWhitespace(text) : undefined;
}

function inferTags(id: string, category: string, metadataTags?: string[]): string[] {
  if (metadataTags && metadataTags.length > 0) {
    return [...new Set(metadataTags.map((tag) => normalizeWhitespace(tag.toLowerCase())).filter(Boolean))];
  }

  return [...new Set([category, ...id.replace(/\.md$/i, "").split(/[_\s-]+/).map((part) => part.toLowerCase())])].filter(Boolean);
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => normalizeWhitespace(value)).filter(Boolean))];
}

export function inferSkillMetadata({
  relativePath,
  markdownBody,
  parsedFrontmatter,
  metadataEntry,
  readmeEntry,
}: InferSkillMetadataOptions): SkillRecord {
  const { frontmatter } = parsedFrontmatter;
  const fileName = path.basename(relativePath, ".md");
  const inferredFrom: string[] = [];

  const id = frontmatter?.id ?? metadataEntry?.id ?? fileName;
  if (!frontmatter?.id) {
    inferredFrom.push(metadataEntry?.id ? "metadata.json:id" : "file-path:id");
  }

  const heading = readHeading(markdownBody);
  const title = frontmatter?.title ?? heading ?? readmeEntry?.skillName ?? metadataEntry?.name ?? titleFromId(id);
  if (!frontmatter?.title) {
    inferredFrom.push(heading ? "markdown-heading:title" : readmeEntry?.skillName ? "README.md:title" : "metadata.json:title");
  }

  const name = frontmatter?.name ?? metadataEntry?.name ?? readmeEntry?.skillName ?? title;
  if (!frontmatter?.name) {
    inferredFrom.push(metadataEntry?.name ? "metadata.json:name" : readmeEntry?.skillName ? "README.md:name" : "title:name");
  }

  const category = frontmatter?.category ?? metadataEntry?.category ?? path.dirname(relativePath);
  if (!frontmatter?.category) {
    inferredFrom.push(metadataEntry?.category ? "metadata.json:category" : "file-path:category");
  }

  const summary = frontmatter?.summary ?? extractSection(markdownBody, ["Purpose", "Overview"]);
  if (!frontmatter?.summary && summary) {
    inferredFrom.push("markdown-section:summary");
  }

  const description = frontmatter?.description ?? summary ?? extractSection(markdownBody, ["Expected Output", "When to Use"]);
  if (!frontmatter?.description && description) {
    inferredFrom.push(summary ? "summary:description" : "markdown-section:description");
  }

  const compatibleAgents = uniqueStrings(frontmatter?.compatibleAgents ?? [...defaultCompatibleAgents]);
  const tags = inferTags(id, category, frontmatter?.tags.length ? frontmatter.tags : metadataEntry?.tags);
  const audience = frontmatter?.audience ?? "all";
  const status = frontmatter?.status ?? "active";

  return {
    id,
    name,
    title,
    category,
    path: relativePath,
    summary,
    description,
    tags,
    audience,
    compatibleAgents,
    status,
    source: {
      contentPath: relativePath,
      readmePath: readmeEntry?.path,
      metadataId: metadataEntry?.id,
      hasFrontmatter: parsedFrontmatter.hasFrontmatter,
      inferredFrom: uniqueStrings(inferredFrom),
    },
  };
}
