#!/bin/bash


IP_ADDRESS="167.99.161.107"
SSH_KEY_PATH="$HOME/.ssh/id_rsa"
BUNDLE_FILENAME="VideoChatApp.tar.zst"
REMOTE_USER="root" 


# restart service
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$REMOTE_USER@$IP_ADDRESS" "sudo systemctl restart empirica && sudo systemctl status empirica"