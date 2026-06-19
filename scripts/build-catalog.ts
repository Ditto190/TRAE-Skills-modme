import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { SkillCatalog, SkillIndex } from "../src/skill-frontmatter.schema";
import { parseFrontmatter } from "./parse-frontmatter";
import { parseReadmeTable } from "./parse-readme-table";
import { inferSkillMetadata } from "./infer-skill-metadata";
import { validateCatalog, validateIndex, validateSkill } from "./validate-skill";

interface MetadataEntry {
  id: string;
  name: string;
  category: string;
  tags?: string[];
}

const REPOSITORY_NAME = "Ditto190/TRAE-Skills-modme";
const CATALOG_VERSION = "1.0.0";
const MARKDOWN_DIRECTORIES = [
  "ai_engineering",
  "architecture",
  "backend",
  "code_management",
  "devops",
  "documentation",
  "frontend",
  "mobile",
  "security",
  "testing",
];

async function listMarkdownFiles(repositoryRoot: string): Promise<string[]> {
  const files: string[] = [];

  for (const directory of MARKDOWN_DIRECTORIES) {
    const absoluteDirectory = path.join(repositoryRoot, directory);
    const entries = await readdir(absoluteDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(path.posix.join(directory, entry.name));
      }
    }
  }

  return files.sort((left, right) => left.localeCompare(right));
}

function buildCategorySummary(skills: SkillCatalog["skills"]): SkillCatalog["categories"] {
  const counts = new Map<string, number>();
  for (const skill of skills) {
    counts.set(skill.category, (counts.get(skill.category) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([id, count]) => ({ id, count }));
}

export async function buildCatalogFromRepository(repositoryRoot: string): Promise<{
  catalog: SkillCatalog;
  index: SkillIndex;
}> {
  const readmePath = path.join(repositoryRoot, "README.md");
  const metadataPath = path.join(repositoryRoot, "metadata.json");

  const [readmeContents, metadataContents, markdownFiles] = await Promise.all([
    readFile(readmePath, "utf8"),
    readFile(metadataPath, "utf8"),
    listMarkdownFiles(repositoryRoot),
  ]);

  const readmeEntries = parseReadmeTable(readmeContents);
  const metadataEntries = JSON.parse(metadataContents) as MetadataEntry[];

  const readmeByPath = new Map(readmeEntries.map((entry) => [entry.path, entry]));
  const metadataById = new Map(metadataEntries.map((entry) => [entry.id, entry]));
  const metadataByPath = new Map(
    metadataEntries.map((entry) => [path.posix.join(entry.category, `${entry.id}.md`), entry]),
  );

  const skills = [] as SkillCatalog["skills"];

  for (const relativePath of markdownFiles) {
    const absolutePath = path.join(repositoryRoot, relativePath);
    const contents = await readFile(absolutePath, "utf8");
    const parsedFrontmatter = parseFrontmatter(contents);
    const fileId = path.basename(relativePath, ".md");
    const metadataEntry = metadataById.get(fileId) ?? metadataByPath.get(relativePath);
    const readmeEntry = readmeByPath.get(relativePath);

    const skill = validateSkill(
      inferSkillMetadata({
        relativePath,
        markdownBody: parsedFrontmatter.body,
        parsedFrontmatter,
        metadataEntry,
        readmeEntry,
      }),
    );

    skills.push(skill);
  }

  const generatedAt = new Date().toISOString();
  const catalog = validateCatalog({
    version: CATALOG_VERSION,
    generatedAt,
    repository: {
      name: REPOSITORY_NAME,
      readmePath: "README.md",
      metadataPath: "metadata.json",
    },
    skills,
    categories: buildCategorySummary(skills),
  });

  const index = validateIndex({
    version: CATALOG_VERSION,
    generatedAt,
    skills: skills.map(({ id, name, title, category, path: skillPath, tags, audience, compatibleAgents, status }) => ({
      id,
      name,
      title,
      category,
      path: skillPath,
      tags,
      audience,
      compatibleAgents,
      status,
    })),
  });

  return { catalog, index };
}

export async function writeCatalogArtifacts(repositoryRoot: string): Promise<void> {
  const { catalog, index } = await buildCatalogFromRepository(repositoryRoot);
  const outputDirectory = path.join(repositoryRoot, "catalog");

  await (await import("node:fs/promises")).mkdir(outputDirectory, { recursive: true });

  await Promise.all([
    writeFile(path.join(outputDirectory, "skills.catalog.json"), `${JSON.stringify(catalog, null, 2)}\n`, "utf8"),
    writeFile(path.join(outputDirectory, "skills.index.json"), `${JSON.stringify(index, null, 2)}\n`, "utf8"),
  ]);

  console.log(`Generated ${catalog.skills.length} skills across ${catalog.categories.length} categories.`);
}

async function main(): Promise<void> {
  const repositoryRoot = process.cwd();
  await writeCatalogArtifacts(repositoryRoot);
}

if (require.main === module) {
  void main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
