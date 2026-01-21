# Scene Infrastructure - AWS Deployment with Ansible

Ansible automation for deploying Scene Performance Manager to AWS EC2 with nginx, SSL certificates, and DNS.

## Prerequisites

### 1. Install Required Tools

```bash
# Install Ansible and AWS SDK
pip install ansible boto3

# Install Ansible Galaxy collections
cd infra
ansible-galaxy collection install -r requirements.yml
```

### 2. AWS Configuration

**Option A: AWS SSO (Recommended)**
```bash
# Configure SSO profile
aws configure sso

# Login before running playbooks
aws sso login --profile your-profile-name
export AWS_PROFILE=your-profile-name
```

**Option B: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID="your-key"
export AWS_SECRET_ACCESS_KEY="your-secret"
export AWS_DEFAULT_REGION="eu-west-3"
```

### 3. EC2 Key Pair

```bash
# Create key pair in AWS
aws ec2 create-key-pair \
  --key-name scene_server \
  --region eu-west-3 \
  --query 'KeyMaterial' \
  --output text > ~/.ssh/scene_server.pem

chmod 400 ~/.ssh/scene_server.pem
```

### 4. AWS IAM Permissions

Your AWS user/role needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:AuthorizeSecurityGroupEgress",
        "ec2:DescribeSecurityGroups",
        "ec2:RunInstances",
        "ec2:TerminateInstances",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:CreateTags",
        "ec2:DescribeTags",
        "ec2:DescribeImages",
        "ec2:DescribeKeyPairs",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeAvailabilityZones"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ListResourceRecordSets",
        "route53:ChangeResourceRecordSets"
      ],
      "Resource": "arn:aws:route53:::hostedzone/YOUR_ZONE_ID"
    }
  ]
}
```

## Quick Start

### 1. Configure Secrets

```bash
cd infra

# Interactive setup (recommended)
./scripts/setup-vault.sh --sso

# Or manually
cp vars/secrets.yml.example vars/secrets.yml
ansible-vault encrypt vars/secrets.yml
```

### 2. Deploy

```bash
# Full deployment
ansible-playbook playbooks/deploy.yml --ask-vault-pass
```

### 3. Access Your App

- **HTTP:** `http://<EC2_PUBLIC_IP>`
- **HTTPS:** `https://your-domain.com` (if configured)

## Playbooks

| Playbook | Description | Command |
|----------|-------------|---------|
| `deploy.yml` | Full infrastructure provisioning | `ansible-playbook playbooks/deploy.yml --ask-vault-pass` |
| `update.yml` | Update app (finds EC2 via AWS API) | `ansible-playbook playbooks/update.yml --ask-vault-pass` |
| `sync.yml` | Quick code sync (direct IP) | `ansible-playbook playbooks/sync.yml -e "target_host=<IP>"` |
| `backup.yml` | Backup data directory | `ansible-playbook playbooks/backup.yml --ask-vault-pass` |
| `destroy.yml` | Teardown all infrastructure | `ansible-playbook playbooks/destroy.yml --ask-vault-pass` |

### Quick Code Sync (No AWS Credentials Needed)

For rapid development iterations:

```bash
# By IP address
ansible-playbook playbooks/sync.yml -e "target_host=15.188.23.17"

# By domain name
ansible-playbook playbooks/sync.yml -e "target_host=scene.caramanga.cc"
```

## Directory Structure

```
infra/
├── ansible.cfg                 # Ansible configuration
├── requirements.yml            # Galaxy collection dependencies
├── inventory/
│   ├── hosts.ini              # Static inventory (localhost)
│   ├── aws_ec2.yml            # Dynamic AWS inventory
│   └── group_vars/
│       └── all.yml            # Shared variables
├── vars/
│   ├── main.yml               # Non-sensitive configuration
│   └── secrets.yml.example    # Template for secrets
├── roles/
│   ├── common/                # Base OS setup, firewall, user
│   ├── nodejs/                # Node.js 20.x installation
│   ├── app/                   # Application deployment
│   ├── nginx/                 # Reverse proxy configuration
│   ├── certbot/               # Let's Encrypt SSL
│   ├── security_group/        # AWS Security Group
│   └── route53/               # DNS configuration
├── playbooks/
│   ├── deploy.yml             # Full deployment
│   ├── update.yml             # App update via AWS
│   ├── sync.yml               # Quick code sync
│   ├── backup.yml             # Data backup
│   └── destroy.yml            # Teardown infrastructure
└── scripts/
    └── setup-vault.sh         # Secrets setup helper
```

## Configuration

### Variables (vars/main.yml)

| Variable | Default | Description |
|----------|---------|-------------|
| `app_name` | `scene` | Application name |
| `app_port` | `3333` | Application port |
| `app_dir` | `/opt/scene` | Installation directory |
| `aws_region` | `eu-west-3` | AWS region |
| `vpc_id` | - | VPC ID for deployment |
| `subnet_id` | - | Subnet ID (public, with auto-assign IP) |
| `ec2_instance_type` | `t3.small` | EC2 instance size |
| `ec2_ami` | `ami-00983e8a26e4c9bd9` | Ubuntu 22.04 LTS AMI |
| `nodejs_version` | `20.x` | Node.js version |
| `nginx_client_max_body_size` | `55M` | Max upload size |

### Secrets (vars/secrets.yml)

```yaml
# AWS Configuration
aws_region: "eu-west-3"
ec2_key_name: "scene_server"

# Domain configuration (optional)
domain_name: "scene.example.com"
route53_zone_id: "Z1234567890ABC"
letsencrypt_email: "admin@example.com"
```

### Setup Vault Script Options

```bash
# Standard setup (prompts for AWS credentials)
./scripts/setup-vault.sh

# SSO mode (skips AWS credential prompts)
./scripts/setup-vault.sh --sso

# Testing (no encryption)
./scripts/setup-vault.sh --sso --no-encrypt

# Help
./scripts/setup-vault.sh --help
```

## Deployment Flow

### deploy.yml

1. **Security Group** - Create SG with ports 22, 80, 443
2. **EC2 Instance** - Launch Ubuntu 22.04 with tags
3. **Route53** - Create DNS A record (if domain configured)
4. **Common** - Install packages, configure firewall, create user
5. **Node.js** - Install Node.js 20.x via NodeSource
6. **App** - Sync code, npm install, systemd service
7. **Nginx** - Install and configure reverse proxy
8. **Certbot** - Obtain SSL certificate (if domain configured)

### destroy.yml

1. **Confirmation** - Prompt for "DESTROY" confirmation
2. **Backup** - Download data directory to local machine
3. **Route53** - Remove DNS record
4. **EC2** - Terminate instance
5. **Security Group** - Delete security group

## SSL Certificates

SSL is automatically configured when `domain_name` and `letsencrypt_email` are set:

1. Nginx deploys with HTTP configuration
2. Certbot obtains certificate via nginx plugin
3. Certbot configures nginx for HTTPS with redirect
4. Auto-renewal cron job runs daily at 3 AM

## Troubleshooting

### SSH Connection Failed

```bash
# Check key permissions
chmod 400 ~/.ssh/scene_server.pem

# Test SSH manually
ssh -i ~/.ssh/scene_server.pem ubuntu@<EC2_IP>
```

### AWS Permissions Error

```bash
# Verify your identity
aws sts get-caller-identity

# Check if SSO session expired
aws sso login --profile your-profile-name
```

### Ansible Vault Password

```bash
# Create password file for convenience
echo 'your-vault-password' > ~/.vault_pass
chmod 600 ~/.vault_pass
export ANSIBLE_VAULT_PASSWORD_FILE=~/.vault_pass

# Then run without --ask-vault-pass
ansible-playbook playbooks/deploy.yml
```

### View/Edit Encrypted Secrets

```bash
# View
ansible-vault view vars/secrets.yml

# Edit
ansible-vault edit vars/secrets.yml
```

### Check Application Status on Server

```bash
# SSH to server
ssh -i ~/.ssh/scene_server.pem ubuntu@<EC2_IP>

# Check services
systemctl status scene
systemctl status nginx

# View logs
journalctl -u scene -f
tail -f /var/log/nginx/error.log

# Test nginx config
nginx -t
```

## Security Features

- **UFW Firewall** - Only ports 22, 80, 443 open
- **Fail2ban** - SSH brute-force protection
- **Systemd Hardening** - NoNewPrivileges, ProtectSystem, PrivateTmp
- **Nginx Security Headers** - X-Frame-Options, X-Content-Type-Options, etc.
- **SSL/TLS** - Let's Encrypt certificates with auto-renewal
- **Rate Limiting** - nginx rate limits on API endpoints

## Backups

### Manual Backup

```bash
ansible-playbook playbooks/backup.yml --ask-vault-pass
```

Backups are saved to `infra/backups/<timestamp>/`

### Restore Data

```bash
# Sync backup to server
rsync -avz backups/2026-01-20_1200/ ubuntu@<EC2_IP>:/opt/scene/data/
```

## Contributing

1. Test changes locally with `--check` (dry-run):
   ```bash
   ansible-playbook playbooks/deploy.yml --check --ask-vault-pass
   ```

2. Use `sync.yml` for rapid iteration during development

3. Run destroy and full deploy to test complete flow
