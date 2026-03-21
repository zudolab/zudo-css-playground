#!/usr/bin/env bash
set -euo pipefail

echo "=== Step 1: TypeScript check ==="
pnpm check

echo "=== Step 2: Build playground app ==="
pnpm build

echo "=== Step 3: Doc build (if doc/ exists) ==="
if [ -d "doc" ] && [ -f "doc/package.json" ]; then
  pnpm doc:build
fi

echo "=== All checks passed ==="
