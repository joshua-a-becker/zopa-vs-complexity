#!/bin/bash

# Empirica Deployment Script
# Hard-coded for this project

set -e  # Exit on any error

IP_ADDRESS="167.99.161.107"
SSH_KEY_PATH="$HOME/.ssh/id_rsa"
BUNDLE_FILENAME="VideoChatApp.tar.zst"
REMOTE_USER="root" 

echo "Deploying to $IP_ADDRESS..."

# Bundle the application
empirica bundle

# Transfer bundle to server
scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$BUNDLE_FILENAME" "$REMOTE_USER@$IP_ADDRESS:~/"

# Install Empirica and kill any existing empirica processes
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" << EOF
pkill -f empirica || true
curl https://install.empirica.dev | sh -s
EOF

# Set up service
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" 'sudo bash -s' < ./setup_service.sh


# set caddyfile
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" 'sudo bash -s' < ./setup-caddy.sh

# set pagefile
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" 'sudo bash -s' < ./create_pagefile.sh


# download logs
# scp -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS:~/empirica.log" .



# check caddyfile
# ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" cat /etc/caddy/Caddyfile


# update caddyfile
# ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" 'sudo bash -s' < ./update-caddy.sh

# monitor
# ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" "sudo journalctl -u empirica -f"

# ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" "sudo journalctl -u empirica -n 100 --no-pager " > log.txt


# ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" "sudo journalctl -u empirica --no-pager; sudo journalctl -u empirica -f" > empirica.log

# copy 