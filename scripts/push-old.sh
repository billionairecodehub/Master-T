#!/usr/bin/env sh
# Push helper: add, commit (if any), rebase from 'old', then push to 'old'
# Usage: ./scripts/push-old.sh "commit message"

BRANCH=$(git rev-parse --abbrev-ref HEAD)
MSG=${1:-"Update from local"}

echo "Branch: $BRANCH"

git add -A
# commit if there are staged changes
if git diff --cached --quiet; then
  echo "No staged changes to commit"
else
  git commit -m "$MSG"
fi

# Fetch and rebase from remote 'old' (safe merge)
git fetch old || true
git pull --rebase old $BRANCH || echo "rebase failed or nothing to rebase"

# Push to old explicitly
git push old $BRANCH

exit 0
