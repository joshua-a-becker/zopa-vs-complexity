#!/bin/bash

# Empirica Deployment Script
# Hard-coded for this project

set -e  # Exit on any error

IP_ADDRESS="157.245.212.151"
SSH_KEY_PATH="$HOME/.ssh/videochat_rsa"
BUNDLE_FILENAME="videochat.tar.zst"
REMOTE_USER="root"  # Default for DigitalOcean droplets

echo "Deploying to $IP_ADDRESS..."

# Bundle the application
empirica bundle

# Transfer bundle to server
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$BUNDLE_FILENAME" "$REMOTE_USER@$IP_ADDRESS:~/"

# Install Empirica and start server
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" << EOF
pkill -f empirica || true
curl https://install.empirica.dev | sh -s
nohup empirica serve $BUNDLE_FILENAME > empirica.log 2>&1 &
EOF


echo "Deployed! Available at: http://$IP_ADDRESS:3000"