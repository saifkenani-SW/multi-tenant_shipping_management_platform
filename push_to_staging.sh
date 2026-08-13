#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment to develop and staging..."

# Check if there are any uncommitted changes
HAS_CHANGES=false
if ! git diff-index --quiet HEAD --; then
    echo "📦 Uncommitted changes detected. Stashing..."
    git stash
    HAS_CHANGES=true
fi

echo "⬆️ Pushing current branch to develop..."
git push origin develop

echo "🔀 Switching to staging branch..."
git checkout staging

echo "⬇️ Pulling latest staging..."
git pull origin staging

echo "🔄 Merging develop into staging..."
# If there's a conflict here, the script will stop (due to set -e)
# and you will need to resolve the conflict manually.
git merge develop --no-edit

echo "⬆️ Pushing staging..."
git push origin staging

echo "⬅️ Switching back to develop..."
git checkout develop

# Restore the stashed changes if any
if [ "$HAS_CHANGES" = true ]; then
    echo "📦 Restoring stashed changes..."
    git stash pop
fi

echo "✅ Successfully pushed to develop and merged into staging!"
