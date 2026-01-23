#!/bin/bash

SWAP_SIZE="4G"
SWAP_FILE="/swapfile"

# Exit on error
set -e

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root (use sudo)"
    exit 1
fi

# Check if swap file already exists
if [ -f "$SWAP_FILE" ]; then
    echo "Swap file already exists at $SWAP_FILE"
    exit 1
fi

# Create swap file
echo "Creating ${SWAP_SIZE} swap file..."
fallocate -l "$SWAP_SIZE" "$SWAP_FILE" || dd if=/dev/zero of="$SWAP_FILE" bs=1M count=4096

# Set permissions
chmod 600 "$SWAP_FILE"

# Format and enable
mkswap "$SWAP_FILE"
swapon "$SWAP_FILE"

# Add to fstab if not already there
if ! grep -q "$SWAP_FILE" /etc/fstab; then
    echo "$SWAP_FILE none swap sw 0 0" >> /etc/fstab
    echo "Added to /etc/fstab"
fi

echo "Swap enabled:"
swapon --show