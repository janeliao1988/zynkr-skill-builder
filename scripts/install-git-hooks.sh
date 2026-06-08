#!/usr/bin/env bash
#
# install-git-hooks.sh
#
# Re-installs the gitleaks pre-commit secret-scanning hook into .git/hooks.
# .git/hooks is NOT versioned, so run this after every fresh clone:
#
#     bash scripts/install-git-hooks.sh
#
# The hook blocks any commit whose staged changes contain a potential secret.
set -euo pipefail

# Resolve the repo root (works regardless of where the script is invoked from).
REPO_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$REPO_ROOT/.git/hooks"
PRE_COMMIT="$HOOKS_DIR/pre-commit"

mkdir -p "$HOOKS_DIR"

# Back up an existing pre-commit hook before overwriting (skip our own).
if [ -f "$PRE_COMMIT" ] && ! grep -q "gitleaks protect --staged" "$PRE_COMMIT" 2>/dev/null; then
  BACKUP="$PRE_COMMIT.bak-$(date +%Y%m%d%H%M%S)"
  cp "$PRE_COMMIT" "$BACKUP"
  echo "[install-git-hooks] Existing pre-commit backed up to $BACKUP"
fi

cat > "$PRE_COMMIT" <<'HOOK'
#!/usr/bin/env bash
if ! command -v gitleaks >/dev/null 2>&1; then echo "[pre-commit] gitleaks not installed - skipping secret scan"; exit 0; fi
gitleaks protect --staged --redact --no-banner
status=$?
if [ $status -ne 0 ]; then echo "[pre-commit] gitleaks found a potential secret. Commit blocked. Run 'gitleaks protect --staged -v' to inspect."; exit 1; fi
exit 0
HOOK

chmod +x "$PRE_COMMIT"
echo "[install-git-hooks] Installed gitleaks pre-commit hook at $PRE_COMMIT"
