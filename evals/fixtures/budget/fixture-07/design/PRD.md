---
artifact: prd
stage: 0
provenance: validated
evidence: proto
schemaVersion: 1
---

# SketchNote — Handwriting-to-Markdown Converter

## Problem
People who prefer handwritten notes end up with content trapped on paper or as unstructured images.

## Target Users
- Students, researchers, and writers who use paper notebooks or drawing tablets
- Professionals who sketch meeting notes and want them in their note apps (Notion, Obsidian)

## Jobs-to-be-Done
1. When I finish a meeting, I want to photograph my notebook page and get clean Markdown in 30 seconds.
2. When I've converted a note, I want to push it directly to my Notion workspace.

## Scope (v1)
- Photo/scan upload (mobile camera + desktop file)
- Handwriting OCR with Markdown formatting
- Heading detection, bullet list inference
- One-click export to Notion, Obsidian, or clipboard

## Out of Scope
- Diagram/sketch recognition
- Real-time capture from stylus
