#!/usr/bin/env bash
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
REPO="peter-tu-zynkr/writing-agent"
BRANCH="main"
BASE_URL="https://raw.githubusercontent.com/${REPO}/${BRANCH}"
TARGET_DIR="${1:-$PWD}"
SKILL_NAME="write-article"
SKILL_DIR="${TARGET_DIR}/.claude/skills/${SKILL_NAME}"
AGENTS_DIR="${TARGET_DIR}/.claude/agents"

# ── Helpers ───────────────────────────────────────────────────────────────────
download() {
  local src="$1"
  local dest="$2"
  mkdir -p "$(dirname "$dest")"
  curl -fsSL "${BASE_URL}/${src}" -o "$dest"
  echo "  ✓ ${dest}"
}

# ── Backup existing ───────────────────────────────────────────────────────────
if [ -d "${SKILL_DIR}" ]; then
  TIMESTAMP=$(date +%Y%m%d%H%M%S)
  BACKUP="${SKILL_DIR}.backup-${TIMESTAMP}"
  echo "⚠️  Backing up existing skill → ${BACKUP}"
  mv "${SKILL_DIR}" "${BACKUP}"
fi

echo ""
echo "⚡ Installing ${SKILL_NAME} into ${TARGET_DIR}"
echo ""

# ── Skill SKILL.md ────────────────────────────────────────────────────────────
download \
  ".claude/skills/${SKILL_NAME}/SKILL.md" \
  "${SKILL_DIR}/SKILL.md"

# ── References ────────────────────────────────────────────────────────────────
REFS=(
  "stage-0-socratic.md"
  "stage-1-article-structure.md"
  "stage-1-style-selection.md"
  "stage-2-article-draft.md"
  "stage-2-style-guide.md"
  "stage-3-5-reader-perspective.md"
  "stage-3-editor-guide.md"
  "stage-3-editor.md"
  "stage-4-article-title.md"
  "stage-4-seo-list.md"
  "stage-5-cta-selection.md"
  "stage-5-cta-writing.md"
)

for ref in "${REFS[@]}"; do
  download \
    ".claude/skills/${SKILL_NAME}/references/${ref}" \
    "${SKILL_DIR}/references/${ref}"
done

# ── Agents ────────────────────────────────────────────────────────────────────
AGENTS=(
  "article-drafter.md"
  "article-editor.md"
  "article-style-selector.md"
  "article-title-suggester.md"
  "cta-writer.md"
  "reader-perspective.md"
  "socratic-ideation-partner.md"
)

for agent in "${AGENTS[@]}"; do
  download \
    ".claude/agents/${agent}" \
    "${AGENTS_DIR}/${agent}"
done

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "✅ Done! Installed to ${TARGET_DIR}"
echo ""
echo "   Skill  → ${SKILL_DIR}"
echo "   Agents → ${AGENTS_DIR}"
echo ""
echo "Next steps:"
echo "   1.  cd ${TARGET_DIR}"
echo "   2.  claude"
echo "   3.  /write-article"
echo ""
