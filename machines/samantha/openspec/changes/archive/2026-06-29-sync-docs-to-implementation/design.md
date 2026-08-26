## Context

This is a documentation-only change with no architectural decisions to make. The design doc is included for completeness but is minimal.

## Goals / Non-Goals

**Goals:**
- Update three files to match actual implementation: `Project file/MVP 1 scope.md`, `Project file/Technology stack.md`, `CLAUDE.md`

**Non-Goals:**
- No code changes
- No spec changes (OpenSpec specs are already correct)
- No structural reorganisation of docs

## Decisions

**Edit in place, don't rewrite.** Only change the specific facts that are wrong — song count, music provider, birth year bounds. Preserve all existing prose and structure.

## Risks / Trade-offs

- [Risk] Docs drift again after future changes → Mitigation: archive each change's OpenSpec artifacts; run this sync pattern after any major feature lands.
