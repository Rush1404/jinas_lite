#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# sync-images-to-r2.sh
#
# Syncs product images from your WD My Cloud Home (mounted as a network share)
# to Cloudflare R2, so they're served globally via CDN.
#
# PREREQUISITES:
#   1. Mount your WD My Cloud Home share (SMB) to a local path.
#      macOS:  mount_smbfs //guest@MYCLOUD/Public /Volumes/MyCloudHome
#      Linux:  mount -t cifs //MYCLOUD/Public /mnt/mycloud -o guest
#
#   2. Install rclone:  https://rclone.org/install/
#
#   3. Configure rclone with your R2 credentials:
#      rclone config
#        → New remote → name: r2
#        → Storage: S3 Compatible
#        → Provider: Cloudflare
#        → Access Key / Secret Key (from R2 Dashboard → Manage R2 API Tokens)
#        → Endpoint: https://<ACCOUNT_ID>.r2.cloudflarestorage.com
#
# USAGE:
#   ./sync-images-to-r2.sh
#
# SCHEDULE (optional):
#   Run this via cron on any always-on machine (your Mac, a Raspberry Pi, etc.)
#   crontab -e → add:
#   0 * * * * /path/to/sync-images-to-r2.sh >> /var/log/jinas-sync.log 2>&1
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────

# Where your WD My Cloud Home share is mounted
NAS_MOUNT="/Volumes/MyCloudHome"           # macOS example
# NAS_MOUNT="/mnt/mycloud"                 # Linux example

# The folder on the NAS where Jina drops product photos
SOURCE_DIR="${NAS_MOUNT}/JinasLite/product-images"

# Rclone remote name (from `rclone config`)
R2_REMOTE="r2"

# R2 bucket name
R2_BUCKET="jinas-lite-media"

# Target prefix inside the bucket (matches image_path in Supabase)
R2_PREFIX="products"

# ─── Pre-flight checks ───────────────────────────────────────────────────────

if [ ! -d "$SOURCE_DIR" ]; then
  echo "ERROR: Source directory not found: $SOURCE_DIR"
  echo "       Is the NAS mounted?"
  exit 1
fi

if ! command -v rclone &> /dev/null; then
  echo "ERROR: rclone is not installed. See https://rclone.org/install/"
  exit 1
fi

# ─── Convert images to WebP (optional, saves bandwidth + storage) ────────────
# Requires: brew install webp  (or apt install webp)

if command -v cwebp &> /dev/null; then
  echo "Converting new images to WebP..."
  find "$SOURCE_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r img; do
    webp_path="${img%.*}.webp"
    if [ ! -f "$webp_path" ]; then
      echo "  Converting: $(basename "$img") → $(basename "$webp_path")"
      cwebp -q 85 -resize 800 0 "$img" -o "$webp_path" 2>/dev/null
    fi
  done
else
  echo "NOTICE: cwebp not found. Syncing original images without conversion."
  echo "        Install with: brew install webp (macOS) or apt install webp (Linux)"
fi

# ─── Sync to R2 ──────────────────────────────────────────────────────────────

echo ""
echo "Syncing images to Cloudflare R2..."
echo "  From: $SOURCE_DIR"
echo "  To:   ${R2_REMOTE}:${R2_BUCKET}/${R2_PREFIX}"
echo ""

rclone sync "$SOURCE_DIR" "${R2_REMOTE}:${R2_BUCKET}/${R2_PREFIX}" \
  --include "*.webp" \
  --include "*.jpg" \
  --include "*.jpeg" \
  --include "*.png" \
  --progress \
  --transfers 8 \
  --checkers 16 \
  --fast-list \
  --log-level INFO

echo ""
echo "Sync complete. $(date)"