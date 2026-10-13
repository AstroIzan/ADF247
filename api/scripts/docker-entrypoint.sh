#!/bin/sh
set -eu

if [ "${PRISMA_RECOVER_MESSAGING_MIGRATION:-}" = "1" ]; then
  set +e
  recovery_output="$(
    /app/database/node_modules/.bin/prisma migrate resolve \
      --rolled-back 20261009230500_messaging_schema \
      --schema /app/database/prisma/schema.prisma 2>&1
  )"
  recovery_status=$?
  set -e

  if [ "${recovery_status}" -eq 0 ]; then
    echo "Recovered failed Messaging Prisma migration."
  elif printf '%s' "${recovery_output}" | grep -Eqi "not.*failed|not in a failed state|does not exist"; then
    echo "Messaging Prisma migration recovery is not required."
  else
    printf '%s\n' "${recovery_output}" >&2
    exit "${recovery_status}"
  fi
fi

exec "$@"
