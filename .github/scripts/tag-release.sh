#!/usr/bin/env bash
#
# Tag a per-package release.
#
# Usage: tag-release.sh <package-name> [--push]
#
# One `vX.Y.Z` tag cannot name two packages here: theme, terminal and git each
# shipped a v0.1.0, a v0.4.0 and a v0.5.0, so seven tag names would collide.
# Tags are therefore `<package-name>@<version>`, the convention changesets uses.
# No `v` alias is created — in a monorepo with independent version lines it would
# be the ambiguous name it was meant to disambiguate.
#
# The version is read from the package's own manifest, never passed in, so a tag
# cannot disagree with what npm received. Run this after the version is actually
# on the registry: a tag that exists and points at a failed publish claims a
# release that never shipped.
set -euo pipefail

NAME="${1:?usage: tag-release.sh <package-name> [--push]}"
PUSH="${2:-}"

DIR=""
for candidate in plugins/*/package.json web/*/package.json; do
  [ -f "$candidate" ] || continue
  if node -e "process.exit(require('./$candidate').name === process.argv[1] ? 0 : 1)" "$NAME" 2>/dev/null; then
    DIR="$candidate"
    break
  fi
done
if [ -z "$DIR" ]; then
  echo "no workspace package named $NAME" >&2
  exit 1
fi

VERSION="$(node -p "require('./$DIR').version")"
TAG="$NAME@$VERSION"

if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "$TAG already exists" >&2
  exit 1
fi

git tag -a "$TAG" -m "$NAME $VERSION"
echo "tagged $TAG"

if [ "$PUSH" = "--push" ]; then
  git push origin "$TAG"
fi
