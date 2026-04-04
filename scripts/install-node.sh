#!/usr/bin/env bash

# Downloads and activates the pinned Node.js + npm toolchain in .node/.
# Can be sourced from other scripts or executed directly.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${ROOT_DIR:-$(cd "$SCRIPT_DIR/.." && pwd)}"
NODE_VERSION="${NODE_VERSION:-20.11.1}"
LOCAL_NODE_PARENT="${LOCAL_NODE_PARENT:-$ROOT_DIR/.node}"
NODE_BIN_DIR="${NODE_BIN_DIR:-$LOCAL_NODE_PARENT/bin}"
OS_NAME=""
ARCH_NAME=""

detect_platform() {
  case "$(uname -s)" in
    Linux) OS_NAME="linux" ;;
    Darwin) OS_NAME="darwin" ;;
    *)
      echo "Unsupported operating system: $(uname -s)" >&2
      exit 1
      ;;
  esac

  case "$(uname -m)" in
    x86_64) ARCH_NAME="x64" ;;
    arm64 | aarch64) ARCH_NAME="arm64" ;;
    *)
      echo "Unsupported CPU architecture: $(uname -m)" >&2
      exit 1
      ;;
  esac
}

ensure_prereqs() {
  for tool in curl tar; do
    if ! command -v "$tool" >/dev/null 2>&1; then
      echo "Error: $tool is required to install Node.js v${NODE_VERSION}." >&2
      exit 1
    fi
  done
}

download_node_archive() {
  detect_platform
  ensure_prereqs

  local filename="node-v${NODE_VERSION}-${OS_NAME}-${ARCH_NAME}"
  local archive="${filename}.tar.xz"
  local url="https://nodejs.org/dist/v${NODE_VERSION}/${archive}"
  local tmpdir
  tmpdir="$(mktemp -d)"

  echo "Downloading Node.js v${NODE_VERSION} (${OS_NAME}-${ARCH_NAME})..."
  curl -fsSL "$url" -o "${tmpdir}/${archive}"

  echo "Extracting Node.js..."
  mkdir -p "$LOCAL_NODE_PARENT"
  tar -xJf "${tmpdir}/${archive}" -C "$LOCAL_NODE_PARENT"
  rm -rf "$tmpdir"
  echo "Node.js extracted to $LOCAL_NODE_PARENT/${filename}"
}

ensure_local_install() {
  local filename="node-v${NODE_VERSION}-${OS_NAME:-}"
  if [[ -z "$OS_NAME" || -z "$ARCH_NAME" ]]; then
    detect_platform
  fi
  filename="node-v${NODE_VERSION}-${OS_NAME}-${ARCH_NAME}"
  local install_dir="$LOCAL_NODE_PARENT/$filename"

  if [[ ! -d "$install_dir" ]]; then
    download_node_archive
  fi

  mkdir -p "$NODE_BIN_DIR"
  ln -sf "$install_dir/bin/node" "$NODE_BIN_DIR/node"
  ln -sf "$install_dir/bin/npm" "$NODE_BIN_DIR/npm"
  if [[ -f "$install_dir/bin/npx" ]]; then
    ln -sf "$install_dir/bin/npx" "$NODE_BIN_DIR/npx"
  fi
  export PATH="$NODE_BIN_DIR:$PATH"
  echo "Using local Node.js v${NODE_VERSION} from $install_dir"
}

ensure_pinned_node() {
  local desired="v${NODE_VERSION}"
  if command -v node >/dev/null 2>&1; then
    local current
    current="$(node -v 2>/dev/null || true)"
    if [[ "$current" == "$desired" ]] && command -v npm >/dev/null 2>&1; then
      echo "Found system Node.js ${current}; using it."
      return
    fi
    echo "System Node.js version ${current:-unknown} does not match ${desired}; installing local copy."
  else
    echo "Node.js not found; installing local copy."
  fi
  ensure_local_install
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  ensure_pinned_node
  echo ""
  echo "Add the following to your shell profile to use the local toolchain:"
  echo "  export PATH=\"${NODE_BIN_DIR}:\$PATH\""
fi
