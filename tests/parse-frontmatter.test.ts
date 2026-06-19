import test from "node:test";
import assert from "node:assert/strict";

import { parseFrontmatter } from "../scripts/parse-frontmatter";

test("parseFrontmatter extracts YAML metadata and markdown body", () => {
  const parsed = parseFrontmatter(`---
id: sample_skill
name: Sample Skill
tags:
  - docs
  - test
compatibleAgents:
  - cloud-agent
status: active
---
# Skill: Sample Skill

## Purpose
A test skill.
`);

  assert.equal(parsed.hasFrontmatter, true);
  assert.deepEqual(parsed.frontmatter, {
    id: "sample_skill",
    name: "Sample Skill",
    tags: ["docs", "test"],
    compatibleAgents: ["cloud-agent"],
    status: "active",
  });
  assert.match(parsed.body, /^# Skill: Sample Skill/m);
});
