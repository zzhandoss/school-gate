#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${GIT_TAG:-}" ]]; then
  echo "GIT_TAG is required"
  exit 1
fi

if [[ -z "${GIT_SHA:-}" ]]; then
  echo "GIT_SHA is required"
  exit 1
fi

VERSION="${GIT_TAG#v}"
ROOT_DIR="$(pwd)"
RELEASE_DIR="${ROOT_DIR}/release"
PREBUILT_DIR="${RELEASE_DIR}/prebuilt"
SOURCE_ZIP="${RELEASE_DIR}/school-gate-${GIT_TAG}-source.zip"
PREBUILT_ZIP="${RELEASE_DIR}/school-gate-${GIT_TAG}-prebuilt.zip"

rm -rf "${RELEASE_DIR}"
mkdir -p "${PREBUILT_DIR}"

git archive --format zip --output "${SOURCE_ZIP}" "${GIT_TAG}"

mkdir -p "${PREBUILT_DIR}/apps" "${PREBUILT_DIR}/packages"

for app_dir in apps/* apps/adapters/*; do
  if [[ -d "${app_dir}" && -d "${app_dir}/dist" ]]; then
    target_dir="${PREBUILT_DIR}/${app_dir}"
    mkdir -p "${target_dir}"
    cp -r "${app_dir}/dist" "${target_dir}/"
    if [[ -f "${app_dir}/package.json" ]]; then
      cp "${app_dir}/package.json" "${target_dir}/"
    fi
  fi
done

for pkg_dir in packages/*; do
  if [[ -d "${pkg_dir}" && -d "${pkg_dir}/dist" ]]; then
    target_dir="${PREBUILT_DIR}/${pkg_dir}"
    mkdir -p "${target_dir}"
    cp -r "${pkg_dir}/dist" "${target_dir}/"
    if [[ -f "${pkg_dir}/package.json" ]]; then
      cp "${pkg_dir}/package.json" "${target_dir}/"
    fi
  fi
done

mkdir -p "${PREBUILT_DIR}/docs"
cp -r docs/runbook "${PREBUILT_DIR}/docs/"
cp -r ops "${PREBUILT_DIR}/"
cp package.json "${PREBUILT_DIR}/"
cp pnpm-lock.yaml "${PREBUILT_DIR}/"
cp pnpm-workspace.yaml "${PREBUILT_DIR}/"
cp .env.example "${PREBUILT_DIR}/"
cp RUN_SERVICES.md "${PREBUILT_DIR}/"

cat > "${PREBUILT_DIR}/RELEASE_MANIFEST.json" <<EOF
{
  "version": "${VERSION}",
  "tag": "${GIT_TAG}",
  "commit": "${GIT_SHA}",
  "builtAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "artifacts": [
    "school-gate-${GIT_TAG}-source.zip",
    "school-gate-${GIT_TAG}-prebuilt.zip"
  ],
  "services": [
    "sg-api",
    "sg-device-service",
    "sg-bot",
    "sg-worker"
  ]
}
EOF

(
  cd "${PREBUILT_DIR}"
  zip -r "${PREBUILT_ZIP}" .
)

(
  cd "${RELEASE_DIR}"
  sha256sum "$(basename "${SOURCE_ZIP}")" "$(basename "${PREBUILT_ZIP}")" > SHA256SUMS
)

echo "Release artifacts created in ${RELEASE_DIR}"
