import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";

import { buildCatalogFromRepository } from "../scripts/build-catalog";

test("buildCatalogFromRepository creates a validated catalog from markdown, README, and metadata", async () => {
  const repositoryRoot = path.resolve(__dirname, "..", "..");
  const { catalog, index } = await buildCatalogFromRepository(repositoryRoot);

  assert.equal(catalog.repository.name, "Ditto190/TRAE-Skills-modme");
  assert.ok(catalog.skills.length > 150, "expected all markdown skills to be cataloged");
  assert.equal(index.skills.length, catalog.skills.length);

  const zodSkill = catalog.skills.find((skill) => skill.id === "Input_Validation_Zod");
  assert.ok(zodSkill, "expected the Input_Validation_Zod skill to be present");
  assert.equal(zodSkill?.category, "security");
  assert.ok(zodSkill?.tags.includes("zod"));
  assert.equal(zodSkill?.source.contentPath, "security/Input_Validation_Zod.md");

  const gatewaySkill = catalog.skills.find((skill) => skill.id === "API_Gateway_Pattern");
  assert.ok(gatewaySkill?.summary?.includes("centralized API gateway"));
});
