#!/bin/bash

# Empirica Deployment Script
# Hard-coded for this project

set -e  # Exit on any error

IP_ADDRESS="209.97.131.189"
SSH_KEY_PATH="$HOME/.ssh/id_rsa"
BUNDLE_FILENAME="VideoChatApp.tar.zst"
REMOTE_USER="root"

echo "Deploying to $IP_ADDRESS..."

# Bundle the application
empirica bundle

# Transfer bundle & roles to server
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$BUNDLE_FILENAME" "$REMOTE_USER@$IP_ADDRESS:~/"

# Install Empirica and start server
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" << EOF

pkill -f empirica || true
curl https://install.empirica.dev | sh -s
nohup empirica serve $BUNDLE_FILENAME > empirica.log 2>&1 &
EOF


echo "Deployed! Available at: http://$IP_ADDRESS:3000"

# download logs
# scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS:~/empirica.log" .

# check caddyfile
# ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" cat /etc/caddy/Caddyfile

# set caddyfile
# ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" 'sudo bash -s' < ./setup-caddy.sh

# update caddyfile
# ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" 'sudo bash -s' < ./update-caddy.sh
