#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

require_command git
require_command gh

REPO_ROOT="$(repo_root)"
cd "$REPO_ROOT"

OWNER="${1:-$(gh api user --jq '.login')}"
REPO_NAME="${2:-$(basename "$REPO_ROOT")}"
FULL_REPO="${OWNER}/${REPO_NAME}"
EXPECTED_REMOTE_URL="$(normalize_github_https_remote "$OWNER" "$REPO_NAME")"
CURRENT_BRANCH="$(git branch --show-current)"

[[ -n "$CURRENT_BRANCH" ]] || die "The repository must be on a named branch before pushing."

EXISTING_ORIGIN_URL="$(git remote get-url origin 2>/dev/null || true)"
if [[ -n "$EXISTING_ORIGIN_URL" ]] && ! remote_matches_expected "$EXISTING_ORIGIN_URL" "$OWNER" "$REPO_NAME"; then
  die "origin points to $EXISTING_ORIGIN_URL, expected $EXPECTED_REMOTE_URL"
fi

if gh repo view "$FULL_REPO" >/dev/null 2>&1; then
  info "GitHub repository already exists: $FULL_REPO"
else
  info "Creating public GitHub repository: $FULL_REPO"
  gh repo create "$FULL_REPO" --public --disable-wiki
fi

if [[ -z "$EXISTING_ORIGIN_URL" ]]; then
  info "Adding origin remote: $EXPECTED_REMOTE_URL"
  git remote add origin "$EXPECTED_REMOTE_URL"
else
  info "Keeping existing origin remote: $EXISTING_ORIGIN_URL"
fi

info "Pushing ${CURRENT_BRANCH} to origin"
git push -u origin "$CURRENT_BRANCH"

info "GitHub bootstrap complete: https://github.com/${FULL_REPO}"
