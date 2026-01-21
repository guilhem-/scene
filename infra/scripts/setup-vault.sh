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
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Default options
USE_SSO=false
SKIP_ENCRYPT=false

# Parse arguments
show_help() {
    echo "Usage: $(basename "$0") [OPTIONS]"
    echo
    echo "Options:"
    echo "  --sso         Use AWS SSO authentication (skip AWS credential prompts)"
    echo "  --no-encrypt  Create secrets file without encrypting (for testing)"
    echo "  -h, --help    Show this help message"
    echo
    echo "Examples:"
    echo "  $(basename "$0")           # Full setup with AWS credentials"
    echo "  $(basename "$0") --sso     # SSO mode - only domain/SSL config"
    echo
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --sso)
            USE_SSO=true
            shift
            ;;
        --no-encrypt)
            SKIP_ENCRYPT=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo "=========================================="
echo "Scene - Ansible Vault Setup"
if [ "$USE_SSO" = true ]; then
    echo -e "${CYAN}Mode: AWS SSO${NC}"
fi
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
echo "Creating new secrets file..."
echo

echo "Please provide your configuration values:"
echo "(Press Enter to skip optional fields)"
echo

# Collect AWS credentials only if not using SSO
if [ "$USE_SSO" = false ]; then
    echo -e "${CYAN}AWS Credentials${NC}"
    read -p "AWS Access Key ID (or press Enter to use env vars): " aws_access_key
    read -s -p "AWS Secret Access Key (or press Enter to use env vars): " aws_secret_key
    echo
    echo
fi

# Always collect these values
echo -e "${CYAN}Domain Configuration (optional - for HTTPS)${NC}"
read -p "Domain name (e.g., scene.example.com): " domain_name
if [ -n "$domain_name" ]; then
    read -p "Route53 Zone ID (required for domain): " route53_zone_id
    read -p "Let's Encrypt email (required for SSL): " letsencrypt_email
else
    route53_zone_id=""
    letsencrypt_email=""
fi
echo

echo -e "${CYAN}AWS Configuration${NC}"
read -p "AWS Region [eu-west-3]: " aws_region
read -p "EC2 Key Pair name [scene_server]: " ec2_key_name

# Set defaults
aws_region="${aws_region:-eu-west-3}"
ec2_key_name="${ec2_key_name:-scene_server}"

# Build secrets file
cat > "$SECRETS_FILE" << EOF
---
# Ansible Vault encrypted secrets for Scene Performance Manager
# Generated on: $(date)
# Mode: $([ "$USE_SSO" = true ] && echo "AWS SSO" || echo "AWS IAM Credentials")

EOF

if [ "$USE_SSO" = true ]; then
    cat >> "$SECRETS_FILE" << EOF
# AWS Authentication: Using SSO
# Run 'aws sso login --profile <your-profile>' before deploying
# Then set: export AWS_PROFILE=<your-profile>

EOF
else
    if [ -n "$aws_access_key" ]; then
        echo "aws_access_key: \"$aws_access_key\"" >> "$SECRETS_FILE"
    fi
    if [ -n "$aws_secret_key" ]; then
        echo "aws_secret_key: \"$aws_secret_key\"" >> "$SECRETS_FILE"
    fi
    if [ -z "$aws_access_key" ] && [ -z "$aws_secret_key" ]; then
        cat >> "$SECRETS_FILE" << EOF
# AWS Authentication: Using environment variables or ~/.aws/credentials

EOF
    fi
fi

cat >> "$SECRETS_FILE" << EOF
# AWS Configuration
aws_region: "$aws_region"
ec2_key_name: "$ec2_key_name"

# Domain configuration (optional - for HTTPS)
domain_name: "$domain_name"
route53_zone_id: "$route53_zone_id"
letsencrypt_email: "$letsencrypt_email"
EOF

# Encrypt the file (unless skipped)
if [ "$SKIP_ENCRYPT" = true ]; then
    echo
    echo -e "${YELLOW}Skipping encryption (--no-encrypt flag set)${NC}"
    echo -e "${YELLOW}WARNING: secrets.yml is NOT encrypted!${NC}"
else
    echo
    echo "Encrypting secrets file..."
    echo "You will be prompted to create a vault password."
    echo
    ansible-vault encrypt "$SECRETS_FILE"
fi

echo
echo -e "${GREEN}=========================================="
echo "Secrets file created!"
echo "==========================================${NC}"
echo
echo "File location: $SECRETS_FILE"
echo

if [ "$USE_SSO" = true ]; then
    echo "Usage with AWS SSO:"
    echo "  aws sso login --profile <your-profile>"
    echo "  export AWS_PROFILE=<your-profile>"
    if [ "$SKIP_ENCRYPT" = false ]; then
        echo "  ansible-playbook playbooks/deploy.yml --ask-vault-pass"
    else
        echo "  ansible-playbook playbooks/deploy.yml"
    fi
else
    echo "Usage:"
    if [ "$SKIP_ENCRYPT" = false ]; then
        echo "  ansible-playbook playbooks/deploy.yml --ask-vault-pass"
    else
        echo "  ansible-playbook playbooks/deploy.yml"
    fi
fi
echo
echo "Or set ANSIBLE_VAULT_PASSWORD_FILE:"
echo "  echo 'your-password' > ~/.vault_pass"
echo "  chmod 600 ~/.vault_pass"
echo "  export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass"
echo
echo "To edit secrets later:"
echo "  ansible-vault edit $SECRETS_FILE"
echo
