#!/usr/bin/env bash
set -euo pipefail

VERSION="v22.16.0"
DEST="src-tauri/binaries"

# Detect platform
case "$(uname -s)" in
  Darwin) PLATFORM="darwin" ;;
  Linux)  PLATFORM="linux" ;;
  *)      echo "Unsupported OS: $(uname -s)"; exit 1 ;;
esac

# Detect architecture
case "$(uname -m)" in
  arm64|aarch64) ARCH="arm64"; TRIPLE="aarch64-apple-darwin" ;;
  x86_64)        ARCH="x64";   TRIPLE="x86_64-apple-darwin" ;;
  *)             echo "Unsupported arch: $(uname -m)"; exit 1 ;;
esac

# Linux triples
if [ "$PLATFORM" = "linux" ]; then
  case "$ARCH" in
    arm64) TRIPLE="aarch64-unknown-linux-gnu" ;;
    x64)   TRIPLE="x86_64-unknown-linux-gnu" ;;
  esac
fi

# Tauri expects: binaries/node-{target-triple}
TARGET_NAME="node-${TRIPLE}"

mkdir -p "$DEST"

if [ -f "$DEST/$TARGET_NAME" ]; then
  echo "Node binary already exists at $DEST/$TARGET_NAME"
  exit 0
fi

TARBALL="node-${VERSION}-${PLATFORM}-${ARCH}.tar.gz"
URL="https://nodejs.org/dist/${VERSION}/${TARBALL}"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

echo "Downloading Node.js ${VERSION} for ${PLATFORM}-${ARCH}..."
curl -fSL "$URL" -o "$TMPDIR/${TARBALL}"

echo "Extracting..."
tar -xzf "$TMPDIR/${TARBALL}" -C "$TMPDIR"
cp "$TMPDIR/node-${VERSION}-${PLATFORM}-${ARCH}/bin/node" "$DEST/$TARGET_NAME"
chmod +x "$DEST/$TARGET_NAME"

echo "Node binary saved to $DEST/$TARGET_NAME"
