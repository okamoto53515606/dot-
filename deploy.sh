#!/bin/bash
set -e

# ============================================================
# dot-pixel-art Cloud Run デプロイスクリプト（東京リージョン）
# ============================================================

PROJECT="okamo1-153103"
REGION="asia-northeast1"
SERVICE="dot-pixel-art"
REPO="dot-pixel-art-images"
IMAGE_TAG="asia-northeast1-docker.pkg.dev/${PROJECT}/${REPO}/${SERVICE}:v1"

# .env から GOOGLE_GENAI_API_KEY を読み取る
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$GOOGLE_GENAI_API_KEY" ]; then
  echo "エラー: .env に GOOGLE_GENAI_API_KEY が設定されていません"
  exit 1
fi

echo "========================================"
echo "  ドット絵アニメジェネレータ デプロイ"
echo "  プロジェクト: ${PROJECT}"
echo "  リージョン:   ${REGION}"
echo "========================================"

# Step 1: Artifact Registry 作成（初回のみ、既存ならスキップ）
echo ""
echo "[1/3] Artifact Registry を確認..."
if gcloud artifacts repositories describe ${REPO} \
  --location=${REGION} \
  --project=${PROJECT} > /dev/null 2>&1; then
  echo "  -> 既存のリポジトリを使用します"
else
  echo "  -> リポジトリを作成します..."
  gcloud artifacts repositories create ${REPO} \
    --repository-format=docker \
    --location=${REGION} \
    --project=${PROJECT}
  echo "  -> 作成完了"
fi

# Step 2: Cloud Build でビルド
echo ""
echo "[2/3] コンテナイメージをビルド..."
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=${PROJECT} \
  --region=${REGION} \
  --substitutions=_IMAGE_TAG=${IMAGE_TAG}

# Step 3: Cloud Run にデプロイ
echo ""
echo "[3/3] Cloud Run にデプロイ..."
gcloud run deploy ${SERVICE} \
  --image=${IMAGE_TAG} \
  --region=${REGION} \
  --project=${PROJECT} \
  --platform=managed \
  --port=8080 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=1 \
  --min-instances=0 \
  --timeout=300 \
  --set-env-vars="GOOGLE_GENAI_API_KEY=${GOOGLE_GENAI_API_KEY}"

echo ""
echo "========================================"
echo "  デプロイ完了！"
echo "  上記の URL にアクセスして動作確認してください"
echo "========================================"
