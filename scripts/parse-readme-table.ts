export interface ReadmeSkillEntry {
  readmeCategory: string;
  skillName: string;
  path: string;
}

const SKILL_LIST_HEADING = "## 📍 Skill List";

function normalizeReadmeCategory(value: string): string {
  return value
    .replace(/\*\*/g, "")
    .replace(/[|]/g, "")
    .replace(/[^\p{L}\p{N}\s&_/-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMarkdownLinkPath(cell: string): string | null {
  const match = cell.match(/\(([^)]+\.md)\)/i);
  return match?.[1] ?? null;
}

export function parseReadmeTable(readmeContents: string): ReadmeSkillEntry[] {
  const start = readmeContents.indexOf(SKILL_LIST_HEADING);
  if (start === -1) {
    throw new Error(`Could not find ${SKILL_LIST_HEADING} in README.md`);
  }

  const lines = readmeContents.slice(start).split(/\r?\n/);
  const entries: ReadmeSkillEntry[] = [];
  let currentCategory = "";
  let inTable = false;

  for (const line of lines) {
    if (!line.trim().startsWith("|")) {
      if (inTable && entries.length > 0) {
        break;
      }
      continue;
    }

    const columns = line
      .split("|")
      .slice(1, -1)
      .map((column) => column.trim());

    if (columns.length < 4) {
      continue;
    }

    if (columns[0] === "Category" || columns[0].startsWith(":---")) {
      inTable = true;
      continue;
    }

    const categoryCell = normalizeReadmeCategory(columns[0]);
    if (categoryCell) {
      currentCategory = categoryCell;
    }

    const path = extractMarkdownLinkPath(columns[3]) ?? extractMarkdownLinkPath(columns[2]);
    if (!path) {
      continue;
    }

    entries.push({
      readmeCategory: currentCategory,
      skillName: columns[1],
      path: path.replace(/^\.\//, ""),
    });
    inTable = true;
  }

  return entries;
}
