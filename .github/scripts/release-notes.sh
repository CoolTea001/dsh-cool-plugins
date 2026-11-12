#!/usr/bin/env bash
#
# Generate categorized release notes from conventional commits.
#
# Usage: release-notes.sh <tag> [path-prefix]
#
# Groups every non-merge commit since the previous tag of the same package by its
# conventional-commit type and prints Markdown sections followed by a
# "Full Changelog" compare link. Run from the repository root.
#
# Tags are `<package-name>@<version>` in this monorepo, so one `vX.Y.Z` sequence
# cannot describe two packages: theme, terminal and git each shipped a v0.1.0, a
# v0.4.0 and a v0.5.0. The previous release is therefore the newest tag that
# shares this tag's package name, and `path-prefix` narrows the history to that
# package's directory so the notes do not list every sibling's commits.
#
# The tag being released does not have to exist yet: releasing it before tagging
# is the safe order, and a tag that does exist is excluded so the range starts at
# the release before this one.

set -euo pipefail

TAG="${1:?usage: release-notes.sh <tag> [path-prefix]}"
PREFIX="${2:-}"

# `<package-name>@<version>`; a bare `v1.2.3` leaves PKG empty and only matches
# tags of that exact shape.
PKG="${TAG%@*}"

REPO="${GITHUB_REPOSITORY:-}"
if [ -z "$REPO" ]; then
  # `origin` may be an SSH remote or a local path (a clone made for testing);
  # only a github.com URL reduces to `owner/name`. Parsed with node rather than
  # sed because the lazy quantifier this needs is unportable in BSD sed.
  ORIGIN="$(git config --get remote.origin.url 2>/dev/null || true)"
  REPO="$(node -e '
    const match = (process.argv[1] || "").match(/github\.com[:/]([^/]+)\/(.+?)(?:\.git)?$/)
    if (match) process.stdout.write(`${match[1]}/${match[2]}`)
  ' "$ORIGIN" 2>/dev/null || true)"
fi

# Previous release tag for this same package, so notes only cover what changed
# since then. `--exclude` drops the tag being released when it already exists.
if [ -n "$PKG" ]; then
  MATCH="${PKG}@[0-9]*"
else
  MATCH='v[0-9]*'
fi
PREV="$(git describe --tags --abbrev=0 --match "$MATCH" --exclude "$TAG" HEAD 2>/dev/null || true)"
if [ -n "$PREV" ]; then
  RANGE="${PREV}..HEAD"
else
  RANGE="HEAD"
fi

# Commit subjects, without merges and without version-bump noise.
SUBJECTS="$(git log --reverse --no-merges --pretty=format:'%s' "$RANGE" -- ${PREFIX:+"$PREFIX"} 2>/dev/null \
  | grep -vE '^(chore|ci|build|style)(\([^)]*\))?!?: *(bump|release)' || true)"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
for group in features fixes performance refactoring documentation tests chores other; do
  : > "$TMP/$group"
done

while IFS= read -r subject; do
  if [ -z "$subject" ]; then
    continue
  fi

  if printf '%s' "$subject" | grep -qE '^[a-z]+(\([^)]*\))?!?:'; then
    type="$(printf '%s' "$subject" | sed -E 's/^([a-z]+)(\([^)]*\))?!?:.*/\1/')"
    text="$(printf '%s' "$subject" | sed -E 's/^[a-z]+(\([^)]*\))?!?: *//')"
  else
    type='other'
    text="$subject"
  fi

  case "$type" in
    feat) group=features ;;
    fix) group=fixes ;;
    perf) group=performance ;;
    refactor) group=refactoring ;;
    docs) group=documentation ;;
    test) group=tests ;;
    ci | chore | build | style) group=chores ;;
    *) group=other ;;
  esac

  printf -- '- %s\n' "$text" >> "$TMP/$group"
done <<< "$SUBJECTS"

sections=''
append_section() {
  local group="$1" title="$2"
  if [ -s "$TMP/$group" ]; then
    if [ -n "$sections" ]; then
      sections="${sections}"$'\n'
    fi
    sections="${sections}### ${title}"$'\n\n'"$(cat "$TMP/$group")"
  fi
}

append_section features 'Features'
append_section fixes 'Bug Fixes'
append_section performance 'Performance'
append_section refactoring 'Refactoring'
append_section documentation 'Documentation'
append_section tests 'Tests'
append_section chores 'Chores'
append_section other 'Other Changes'

if [ -z "$sections" ]; then
  sections='No notable changes.'
fi

printf '%s\n' "$sections"

# The compare link needs a github.com `owner/name`; a local checkout has none, so
# the link is omitted rather than printed with an empty or absolute path in it.
if [ -n "$PREV" ] && [ -n "$REPO" ]; then
  printf '\n**Full Changelog**: https://github.com/%s/compare/%s...%s\n' \
    "$REPO" "$PREV" "$TAG"
fi
