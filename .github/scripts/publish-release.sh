#!/usr/bin/env bash
#
# Tag and release every package that a `pnpm publish` run just published.
#
# Usage: publish-release.sh <summary-json> [--dry-run]
#
# Reads the `pnpm-publish-summary.json` written by `pnpm -r publish
# --report-summary`, and for each entry creates the annotated tag
# `<package-name>@<version>` plus a GitHub release titled with that tag and
# bodied by `release-notes.sh`.
#
# This runs only after a successful publish, so a tag cannot claim a release that
# never shipped. Entries whose tag or release already exists are skipped, which
# makes a re-run of the workflow harmless.
#
# `--dry-run` prints what it would do and creates nothing.

set -euo pipefail

SUMMARY="${1:?usage: publish-release.sh <summary-json> [--dry-run]}"
DRY_RUN="${2:-}"

if [ ! -f "$SUMMARY" ]; then
  echo "no publish summary at $SUMMARY — nothing was published" >&2
  exit 0
fi

# `publishedPackages` is `[]` on a run that published nothing, which is the
# common case: `pnpm -r publish` only publishes a version the registry lacks.
ENTRIES="$(node -e '
  const fs = require("node:fs")
  const summary = JSON.parse(fs.readFileSync(process.argv[1], "utf8"))
  for (const pkg of summary.publishedPackages ?? []) {
    process.stdout.write(`${pkg.name}\t${pkg.version}\n`)
  }
' "$SUMMARY")"

if [ -z "$ENTRIES" ]; then
  echo "nothing was published — no tags or releases to create"
  exit 0
fi

# The notes for each package have to see its own commits only; a package's
# directory is named after the package.
package_dir() {
  local name="$1"
  for candidate in plugins/*/package.json web/*/package.json; do
    [ -f "$candidate" ] || continue
    if node -e "process.exit(require('./$candidate').name === process.argv[1] ? 0 : 1)" "$name" 2>/dev/null; then
      printf '%s\n' "${candidate%/package.json}"
      return 0
    fi
  done
  return 0
}

while IFS=$'\t' read -r NAME VERSION; do
  [ -z "$NAME" ] && continue
  TAG="$NAME@$VERSION"

  # A tag without a release means an earlier run pushed the tag and then failed
  # at `gh release create`. Skipping on the tag alone would leave that release
  # missing forever, so only a tag that already has a release is complete.
  #
  # The remote is authoritative: a local checkout can be missing a tag the
  # registry-adjacent history already has, and re-running `git tag` then fails.
  REMOTE_TAG=false
  git ls-remote --exit-code --tags origin "refs/tags/$TAG" >/dev/null 2>&1 && REMOTE_TAG=true
  LOCAL_TAG=false
  git rev-parse -q --verify "refs/tags/$TAG" >/dev/null && LOCAL_TAG=true

  if [ "$LOCAL_TAG" = true ] && gh release view "$TAG" >/dev/null 2>&1; then
    echo "skip $TAG: tag and release already exist"
    continue
  fi

  DIR="$(package_dir "$NAME")"
  NOTES_FILE="$(mktemp)"

  if [ -n "$DIR" ]; then
    bash .github/scripts/release-notes.sh "$TAG" "${DIR%/}/" > "$NOTES_FILE"
  else
    bash .github/scripts/release-notes.sh "$TAG" > "$NOTES_FILE"
  fi

  if [ "$DRY_RUN" = "--dry-run" ]; then
    echo "would tag $TAG (dir: ${DIR:-none}; on origin: $REMOTE_TAG; locally: $LOCAL_TAG)"
    sed 's/^/    | /' "$NOTES_FILE"
    rm -f "$NOTES_FILE"
    continue
  fi

  if [ "$LOCAL_TAG" = false ]; then
    if [ "$REMOTE_TAG" = true ]; then
      # Tagged earlier but absent from this checkout; fetch it instead of
      # trying to create it again and getting the push rejected.
      git fetch --quiet origin "refs/tags/$TAG:refs/tags/$TAG"
      echo "$TAG: tag already on origin, fetched it locally"
    else
      git tag -a "$TAG" -m "$NAME $VERSION"
      git push origin "refs/tags/$TAG"
    fi
  fi

  # `--verify-tag` aborts instead of letting gh invent a tag from the default
  # branch, so the release always points at the commit the tag was cut from.
  gh release create "$TAG" \
    --title "$TAG" \
    --notes-file "$NOTES_FILE" \
    --verify-tag

  rm -f "$NOTES_FILE"
  echo "released $TAG"
done <<< "$ENTRIES"
