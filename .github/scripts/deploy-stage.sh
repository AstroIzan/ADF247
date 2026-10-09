#!/usr/bin/env bash
set -euo pipefail

stage="${1:?Usage: $0 <pre|pro>}"

case "${stage}" in
  pre)
    deploy_dir="/home/deploy/deployments/ADF247-pre"
    health_port=8082
    env_file="api/.env.pre"
    ;;
  pro)
    deploy_dir="/home/deploy/deployments/ADF247"
    health_port=8081
    env_file="api/.env.pro"
    ;;
  *)
    echo "Unsupported deployment stage: ${stage}" >&2
    exit 2
    ;;
esac

rsync -a --delete \
  --exclude='.git/' \
  --exclude='.env' \
  --exclude="${env_file}" \
  --exclude='secrets/' \
  ./ "${deploy_dir}/"

export DEPLOY_DIR="${deploy_dir}"
python3 - <<'PY'
import json
import os
from pathlib import Path

service_account_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
if service_account_json:
    data = json.loads(service_account_json)
else:
    data = {
        "type": "service_account",
        "project_id": os.environ["FIREBASE_PROJECT_ID"],
        "client_email": os.environ["FIREBASE_CLIENT_EMAIL"],
        "private_key": os.environ["FIREBASE_PRIVATE_KEY"].replace("\\n", "\n"),
    }

path = Path(os.environ["DEPLOY_DIR"]) / "secrets" / "firebase-service-account.json"
path.parent.mkdir(parents=True, exist_ok=True)
path.write_text(json.dumps(data), encoding="utf-8")
path.chmod(0o600)
PY

export FIREBASE_WEB_CONFIG_PATH="${deploy_dir}/.env"
python3 - <<'PY'
import json
import os
from pathlib import Path

config = os.environ.get("FIREBASE_WEB_CONFIG_JSON", "").strip()
vapid_key = os.environ.get("FIREBASE_WEB_VAPID_KEY", "").strip()
path = Path(os.environ["FIREBASE_WEB_CONFIG_PATH"])

if bool(config) != bool(vapid_key):
    raise ValueError("Firebase web configuration and VAPID key must be configured together.")

if config:
    firebase_config = json.loads(config)
    path.write_text(
        "FIREBASE_WEB_CONFIG_JSON="
        + json.dumps(json.dumps(firebase_config, separators=(",", ":")))
        + "\nFIREBASE_WEB_VAPID_KEY="
        + json.dumps(vapid_key)
        + "\n",
        encoding="utf-8",
    )
    path.chmod(0o600)
elif path.exists():
    path.unlink()
PY

sudo /usr/local/sbin/adf247-build "${stage}"
sudo /usr/local/sbin/adf247-migrate "${stage}"
sudo /usr/local/sbin/adf247-deploy "${stage}"

wait_for_endpoint() {
  local name="$1"
  local url="$2"

  for attempt in {1..30}; do
    if curl -fsS "${url}" > /dev/null; then
      return 0
    fi

    echo "${name} not available yet (attempt ${attempt}/30); retrying..."
    sleep 2
  done

  echo "${name} was not available after 60 seconds." >&2
  return 1
}

wait_for_endpoint "Frontend" "http://127.0.0.1:${health_port}/"
wait_for_endpoint "API" "http://127.0.0.1:${health_port}/api/health"
