#  ProjectRecipe

> ⚠️ **注意：`.env` ファイルを必ず用意してください。**  
> 以下の4つの環境変数を設定します。

- `CHANNEL_ACCESS_TOKEN`（LINEのトークン）  
- `CHANNEL_SECRET`（LINEのシークレット）  
- `OPENAI_API_KEY`（OpenAIのAPIキー）  
- `PORT`（`index.ts` を実行するポート番号）

### `.env` ファイルの例：
```
CHANNEL_SECRET=your_channel_secret
CHANNEL_ACCESS_TOKEN=your_access_token
OPENAI_API_KEY=your_openai_key
PORT=3000
```

---

## 🚀 ngrokの使い方

### ✅ 最初だけ
[ngrok](https://ngrok.com/) にログインし、セットアップを済ませておきます。

### ▶️ 起動コマンド：
```bash
ngrok http 3000
```

起動後、以下のような表示になります：

```
Forwarding                    https://ce82-xxx-117-198-130.ngrok-free.app -> http://localhost:3000
```

この中の `https://ce82-xxx-117-198-130.ngrok-free.app` をコピーし、末尾に `/webhook` をつけてLINEのWebhook URLに設定してください。

#### 📌 例：
```
https://ce82-xxx-117-198-130.ngrok-free.app/webhook
```

> ⚠️ **注意：ngrokを再起動するとURLが毎回変わります。**  
> そのたびにWebhook URLを更新してください。
