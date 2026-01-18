#!/bin/bash
# Scene Performance Manager - Ansible Vault Setup Script
# This script helps you create and manage encrypted secrets

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(dirname "$SCRIPT_DIR")"
VARS_DIR="$INFRA_DIR/vars"
SECRETS_FILE="$VARS_DIR/secrets.yml"
SECRETS_EXAMPLE="$VARS_DIR/secrets.yml.example"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Scene - Ansible Vault Setup"
echo "=========================================="
echo

# Check if ansible-vault is installed
if ! command -v ansible-vault &> /dev/null; then
    echo -e "${RED}Error: ansible-vault is not installed.${NC}"
    echo "Please install Ansible first: pip install ansible"
    exit 1
fi

# Check if secrets.yml already exists
if [ -f "$SECRETS_FILE" ]; then
    echo -e "${YELLOW}Warning: $SECRETS_FILE already exists.${NC}"
    echo
    read -p "What would you like to do? [e]dit, [r]ecreate, [v]iew, [q]uit: " action

    case $action in
        e|E)
            echo "Opening secrets file for editing..."
            ansible-vault edit "$SECRETS_FILE"
            echo -e "${GREEN}Secrets updated successfully.${NC}"
            exit 0
            ;;
        r|R)
            echo "Backing up existing secrets file..."
            mv "$SECRETS_FILE" "$SECRETS_FILE.bak.$(date +%Y%m%d%H%M%S)"
            echo "Old secrets backed up."
            ;;
        v|V)
            echo "Viewing secrets file..."
            ansible-vault view "$SECRETS_FILE"
            exit 0
            ;;
        q|Q)
            echo "Exiting."
            exit 0
            ;;
        *)
            echo "Invalid option. Exiting."
            exit 1
            ;;
    esac
fi

# Create new secrets file
echo "Creating new secrets file from template..."
echo

if [ ! -f "$SECRETS_EXAMPLE" ]; then
    echo -e "${RED}Error: Template file not found at $SECRETS_EXAMPLE${NC}"
    exit 1
fi

# Copy template
cp "$SECRETS_EXAMPLE" "$SECRETS_FILE"

echo "Please provide your configuration values:"
echo "(Press Enter to skip optional fields)"
echo

# Collect values
read -p "AWS Access Key ID (or press Enter to use env vars): " aws_access_key
read -s -p "AWS Secret Access Key (or press Enter to use env vars): " aws_secret_key
echo
read -p "Domain name (optional, e.g., scene.example.com): " domain_name
read -p "Route53 Zone ID (optional, required if using domain): " route53_zone_id
read -p "Let's Encrypt email (optional, required for SSL): " letsencrypt_email
read -p "EC2 Key Pair name [scene_server]: " ec2_key_name

# Set defaults
ec2_key_name="${ec2_key_name:-scene_server}"

# Update secrets file
cat > "$SECRETS_FILE" << EOF
---
# Ansible Vault encrypted secrets for Scene Performance Manager
# Encrypted on: $(date)

EOF

if [ -n "$aws_access_key" ]; then
    echo "aws_access_key: \"$aws_access_key\"" >> "$SECRETS_FILE"
fi

if [ -n "$aws_secret_key" ]; then
    echo "aws_secret_key: \"$aws_secret_key\"" >> "$SECRETS_FILE"
fi

echo "" >> "$SECRETS_FILE"
echo "# Domain configuration" >> "$SECRETS_FILE"
echo "domain_name: \"$domain_name\"" >> "$SECRETS_FILE"
echo "route53_zone_id: \"$route53_zone_id\"" >> "$SECRETS_FILE"
echo "letsencrypt_email: \"$letsencrypt_email\"" >> "$SECRETS_FILE"
echo "" >> "$SECRETS_FILE"
echo "# EC2 Key Pair" >> "$SECRETS_FILE"
echo "ec2_key_name: \"$ec2_key_name\"" >> "$SECRETS_FILE"

# Encrypt the file
echo
echo "Encrypting secrets file..."
echo "You will be prompted to create a vault password."
echo
ansible-vault encrypt "$SECRETS_FILE"

echo
echo -e "${GREEN}=========================================="
echo "Secrets file created and encrypted!"
echo "==========================================${NC}"
echo
echo "File location: $SECRETS_FILE"
echo
echo "Usage:"
echo "  ansible-playbook playbooks/deploy.yml --ask-vault-pass"
echo
echo "Or set ANSIBLE_VAULT_PASSWORD_FILE:"
echo "  echo 'your-password' > ~/.vault_pass"
echo "  chmod 600 ~/.vault_pass"
echo "  export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass"
echo
echo "To edit secrets later:"
echo "  ansible-vault edit $SECRETS_FILE"
echo
