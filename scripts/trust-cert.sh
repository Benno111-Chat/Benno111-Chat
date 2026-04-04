#!/usr/bin/env bash
# Trust a TLS certificate locally for development.
# Usage: ./scripts/trust-cert.sh /path/to/cert.pem
# - macOS: adds to System keychain as a trusted root.
# - Debian/Ubuntu: copies into /usr/local/share/ca-certificates and updates store.
# - Fedora/RHEL: uses trust anchor.

set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/cert.pem" >&2
  exit 1
fi

CERT_PATH="$1"
if [[ ! -f "$CERT_PATH" ]]; then
  echo "Certificate not found: $CERT_PATH" >&2
  exit 1
fi

OS="$(uname -s)"

if [[ "$OS" == "Darwin" ]]; then
  echo "Detected macOS. Adding cert to System keychain (requires sudo)..."
  sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "$CERT_PATH"
  echo "Done. Restart browsers/apps that use TLS."
  exit 0
fi

if [[ -f /etc/debian_version ]]; then
  echo "Detected Debian/Ubuntu. Installing to /usr/local/share/ca-certificates (requires sudo)..."
  BASENAME="$(basename "$CERT_PATH")"
  sudo cp "$CERT_PATH" "/usr/local/share/ca-certificates/$BASENAME"
  sudo update-ca-certificates
  echo "Done. Restart browsers/apps that use TLS."
  exit 0
fi

if [[ -f /etc/redhat-release ]] || [[ -f /etc/fedora-release ]]; then
  echo "Detected RHEL/Fedora. Installing trust anchor (requires sudo)..."
  sudo trust anchor "$CERT_PATH"
  echo "Done. Restart browsers/apps that use TLS."
  exit 0
fi

echo "Unknown OS. Please add the certificate manually to your trust store."
exit 1
