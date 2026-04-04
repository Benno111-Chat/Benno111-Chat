#!/usr/bin/env bash

# Ensures Node.js + npm are available (installing a local copy if needed)
# and installs the exact dependency versions defined in package-lock.json.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$ROOT_DIR/scripts/install-node.sh"

install_dependencies() {
  cd "$ROOT_DIR"

  if [[ ! -f package-lock.json ]]; then
    echo "package-lock.json was not found; aborting exact install." >&2
    exit 1
  fi

  if [[ -d node_modules ]]; then
    echo "Removing existing node_modules to ensure a clean install..."
    rm -rf node_modules
  fi

  echo "Installing dependencies pinned in package-lock.json..."
  npm ci
  echo "Dependency installation complete."
}

ensure_pinned_node
install_dependencies
