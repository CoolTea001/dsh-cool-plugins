#!/usr/bin/env bash
#
# Tag a per-package release.
#
# Usage: tag-release.sh <package-name> [--push]
#
# In a monorepo one `vX.Y.Z` tag cannot name two packages, and every plugin
# already has its own version line (four of them shipped a v0.1.0 at different
# commits). Tags are therefore `<package-name>@<version>`, the convention
# changesets uses, plus a `v` alias only when the package is unambiguous.
#
# The version is read from the package's own manifest, never passed in, so a
# tag cannot disagree with what npm received.
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
