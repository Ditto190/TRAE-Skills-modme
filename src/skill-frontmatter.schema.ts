import { z } from "zod";

const slugString = z.string().trim().min(1);
const compatibleAgentSchema = z.string().trim().min(1);

export const KnownSkillCategorySchema = z.enum([
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
]);

export const SkillCategorySchema = z.string().trim().regex(/^[a-z0-9_\-/]+$/i, {
  message: "category must be a non-empty slug-like string",
});

export const SkillAudienceSchema = z.enum(["novice", "intermediate", "expert", "all"]);

export const SkillStatusSchema = z.enum(["active", "draft", "deprecated"]);

export const defaultCompatibleAgents = [
  "github-copilot-cloud",
  "github-copilot-local",
  "cursor",
  "claude",
  "local-agent",
] as const;

export const SkillFrontmatterSchema = z.object({
  id: slugString.optional(),
  name: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1).optional(),
  category: SkillCategorySchema.optional(),
  summary: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  tags: z.array(slugString).default([]),
  audience: SkillAudienceSchema.optional(),
  compatibleAgents: z.array(compatibleAgentSchema).default([...defaultCompatibleAgents]),
  status: SkillStatusSchema.default("active"),
});

export const SkillSourceSchema = z.object({
  contentPath: z.string().trim().min(1),
  readmePath: z.string().trim().min(1).optional(),
  metadataId: z.string().trim().min(1).optional(),
  hasFrontmatter: z.boolean(),
  inferredFrom: z.array(slugString).default([]),
});

export const SkillRecordSchema = z.object({
  id: slugString,
  name: z.string().trim().min(1),
  title: z.string().trim().min(1),
  category: SkillCategorySchema,
  path: z.string().trim().min(1),
  summary: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  tags: z.array(slugString).default([]),
  audience: SkillAudienceSchema.default("all"),
  compatibleAgents: z.array(compatibleAgentSchema).default([...defaultCompatibleAgents]),
  status: SkillStatusSchema.default("active"),
  source: SkillSourceSchema,
});

export const SkillCatalogSchema = z.object({
  version: z.string().trim().min(1),
  generatedAt: z.string().datetime(),
  repository: z.object({
    name: z.string().trim().min(1),
    readmePath: z.string().trim().min(1),
    metadataPath: z.string().trim().min(1),
  }),
  skills: z.array(SkillRecordSchema),
  categories: z.array(
    z.object({
      id: SkillCategorySchema,
      count: z.number().int().nonnegative(),
    }),
  ),
});

export const SkillIndexEntrySchema = SkillRecordSchema.pick({
  id: true,
  name: true,
  title: true,
  category: true,
  path: true,
  tags: true,
  audience: true,
  compatibleAgents: true,
  status: true,
});

export const SkillIndexSchema = z.object({
  version: z.string().trim().min(1),
  generatedAt: z.string().datetime(),
  skills: z.array(SkillIndexEntrySchema),
});

export type KnownSkillCategory = z.infer<typeof KnownSkillCategorySchema>;
export type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>;
export type SkillSource = z.infer<typeof SkillSourceSchema>;
export type SkillRecord = z.infer<typeof SkillRecordSchema>;
export type SkillCatalog = z.infer<typeof SkillCatalogSchema>;
export type SkillIndex = z.infer<typeof SkillIndexSchema>;
