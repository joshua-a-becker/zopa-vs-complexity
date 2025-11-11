#!/bin/bash

# HTTPS Setup Script for DigitalOcean Server
# Run this ON the server (157.245.212.151)

set -e

IP_ADDRESS="157.245.212.151"
DOMAIN="research.negotiation.education"  # Using IP as domain for now

echo "Setting up HTTPS for Empirica server..."

# Update system
apt update && apt upgrade -y

# Install nginx
apt install nginx -y

# Install certbot for Let's Encrypt (won't work with IP, but we'll use self-signed)
apt install openssl -y

# Create self-signed certificate for IP address
mkdir -p /etc/ssl/private
mkdir -p /etc/ssl/certs

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/empirica.key \
  -out /etc/ssl/certs/empirica.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=$IP_ADDRESS"

# Create nginx config
cat > /etc/nginx/sites-available/empirica << 'EOF'
server {
    listen 80;
    server_name _;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /etc/ssl/certs/empirica.crt;
    ssl_certificate_key /etc/ssl/private/empirica.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/empirica /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
systemctl enable nginx

# Open firewall ports
ufw allow 'Nginx Full'
ufw --force enable

echo "HTTPS setup completed!"
echo "Your site will be available at: https://$IP_ADDRESS"
echo "Note: You'll get a security warning due to self-signed certificate"
echo "Click 'Advanced' and 'Proceed to site' to continue"