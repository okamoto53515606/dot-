# Cloud Run デプロイガイド（東京リージョン）

## 概要

ドット絵アニメジェネレータ（dot-）を Cloud Run（asia-northeast1 / 東京）にデプロイする手順です。

- **GCP プロジェクトID**: `okamo1-153103`
- **リージョン**: `asia-northeast1`（東京）
- **サービス名**: `dot-pixel-art`
- **Artifact Registry**: `dot-pixel-art-images`

## なぜ安くなるのか？

| 項目 | Firebase App Hosting (現状) | Cloud Run 直デプロイ (移行後) |
|------|---------------------------|------------------------------|
| min-instances | 1（常時稼働） | 0（アクセス時のみ起動） |
| リージョン | us-central1（US固定） | asia-northeast1（東京） |
| メモリ/CPU | デフォルト（多め） | 512MiB / 1CPU |
| 月額目安 | 約¥2,000 | 約¥30 |

Cloud Run は使った分だけ課金。`min-instances=0` ならアクセスがない時間帯はインスタンスがゼロになり、課金もゼロです。

## 前提条件

- gcloud CLI がインストールされていること
- `gcloud auth login` で認証済みであること
- `gcloud config set project okamo1-153103` でプロジェクト設定済みであること

## 1. Artifact Registry（初回のみ）

```bash
gcloud artifacts repositories create dot-pixel-art-images \
  --repository-format=docker \
  --location=asia-northeast1 \
  --project=okamo1-153103
```

## 2. コンテナイメージのビルド

Cloud Build を使ってビルドします。`_IMAGE_TAG` のバージョンは適宜更新してください。

```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=okamo1-153103 \
  --region=asia-northeast1 \
  --substitutions=_IMAGE_TAG=asia-northeast1-docker.pkg.dev/okamo1-153103/dot-pixel-art-images/dot-pixel-art:v1
```

## 3. Cloud Run へデプロイ

```bash
gcloud run deploy dot-pixel-art \
  --image=asia-northeast1-docker.pkg.dev/okamo1-153103/dot-pixel-art-images/dot-pixel-art:v1 \
  --region=asia-northeast1 \
  --project=okamo1-153103 \
  --platform=managed \
  --port=8080 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=1 \
  --min-instances=0 \
  --timeout=300 \
  --set-env-vars="GOOGLE_GENAI_API_KEY=<あなたのGemini APIキー>"
```

> **重要**: `GOOGLE_GENAI_API_KEY` は `.env` ファイルに書かれている実際のAPIキーに置き換えてください。

## 4. デプロイ確認

```bash
# HTTPステータスとレスポンス時間を確認
curl -s -o /dev/null -w "HTTP Status: %{http_code}\nTTFB: %{time_starttransfer}s\n" \
  https://dot-pixel-art-<PROJECT_NUMBER>.asia-northeast1.run.app/
```

デプロイ成功時に表示される URL にブラウザでアクセスして、アプリが正常動作することを確認してください。

## 5. ドメインマッピング（別途実施）

Cloud Run にカスタムドメインを設定する場合は、以下のコマンドを実行してください。
DNS 側の設定はご自身でお願いします。

```bash
gcloud run domain-mappings create \
  --service=dot-pixel-art \
  --domain=<あなたのドメイン> \
  --region=asia-northeast1 \
  --project=okamo1-153103
```

## 6. AI Studio 側の後始末（任意）

Cloud Run での動作確認が取れたら、AI Studio（Firebase App Hosting）側のデプロイを削除することで、
二重課金を防げます。

1. [Firebase Console](https://console.firebase.google.com) にアクセス
2. プロジェクト `studio-7223594128` を選択
3. 「App Hosting」→ 該当バックエンドを選択 → 削除

## 7. 今後のデプロイ更新

コードを変更したら、イメージタグのバージョンを上げて再度ビルド＆デプロイします。

```bash
# v2 としてビルド
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=okamo1-153103 \
  --region=asia-northeast1 \
  --substitutions=_IMAGE_TAG=asia-northeast1-docker.pkg.dev/okamo1-153103/dot-pixel-art-images/dot-pixel-art:v2

# v2 をデプロイ
gcloud run deploy dot-pixel-art \
  --image=asia-northeast1-docker.pkg.dev/okamo1-153103/dot-pixel-art-images/dot-pixel-art:v2 \
  --region=asia-northeast1 \
  --project=okamo1-153103 \
  --platform=managed \
  --port=8080 \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --max-instances=1 \
  --min-instances=0 \
  --timeout=300 \
  --set-env-vars="GOOGLE_GENAI_API_KEY=<あなたのGemini APIキー>"
```

---

## トラブルシューティング

### ビルドが失敗する場合
- `npm install` が失敗する → `--legacy-peer-deps` が付いているか確認
- TypeScript エラー → `next.config.ts` で `ignoreBuildErrors: true` になっているか確認（設定済み）

### デプロイ後アプリがエラーになる場合
- Cloud Run のログを確認: `gcloud run services logs read dot-pixel-art --region=asia-northeast1 --project=<GCP_PROJECT_ID>`
- `GOOGLE_GENAI_API_KEY` が正しく設定されているか確認
- サービスアカウントに必要な権限があるか確認
