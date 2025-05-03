import express, { Request, Response } from 'express';
import * as line from '@line/bot-sdk';
import dotenv from 'dotenv';
import { GraphAI } from "graphai";
import { openAIAgent } from "@graphai/openai_agent";
import { copyAgent } from "@graphai/vanilla";
import { stringTemplateAgent } from '@graphai/agents';

dotenv.config();

const agents = {
  openAIAgent,
  copyAgent,
  stringTemplateAgent,
};

const graph_data = {
    "version": 0.5,
    "nodes": {
      "inputText": {
        "value": {}
      },
      
      "messages": {
        "value": [],
        "update": ":recipeLLM.messages",
        "isResult": true
      },
      "promptTpl": {
        "agent": "stringTemplateAgent",
        "params": {
          "template": "あなたは家庭料理に詳しい料理研究家です。\n次の食材 **だけ** を使用して、日本の家庭向けレシピを 3 品提案してください。\n■条件\n- 「title」は 25 字以内\n- 「description」は 60 字以内\n- 「steps」は 3〜5 行\n- 出力は JSON 配列のみ（余計な文字禁止）\n\n[\n  {\n    \"title\": \"料理名\",\n    \"description\": \"説明\",\n    \"steps\": [\"手順1\", \"手順2\", \"手順3\"]\n  }\n]\n\n食材リスト: ${:inputText}\n"
        }
      },
      "recipeLLM": {
        "agent": "openAIAgent",
        "params": {
          "model": "gpt-4o-mini"
        },
        "inputs": {
          "messages": ":messages",
          "prompt": ":promptTpl"
        }
      },
      "output": {
        "agent": "stringTemplateAgent",
        "inputs": {
          "text": "${:recipeLLM.text}\n"
        },
        "console": {
          "after": true
        },
        "isResult": true
      },
    }
  }

const channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN;
const channelSecret = process.env.CHANNEL_SECRET;

if (!channelAccessToken || !channelSecret) {
    throw new Error('Missing LINE credentials in environment variables');
  }

const config: line.MiddlewareConfig = {
    channelAccessToken,
    channelSecret,
};

const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken,
  });


const app = express();


// 署名検証込みのミドルウェア（失敗すると 401）
app.post('/webhook',
  line.middleware(config),
  async (req: Request, res: Response): Promise<void> => {
    const event = req.body.events[0];

    // ① テキスト以外は無視
    if (event.type !== 'message' || event.message.type !== 'text') {
      return;
    }
    /* ★★ Graph を動的に生成し、inputText.value を上書き ★★ */
    const graph = new GraphAI(
      {
        ...graph_data,
        nodes: {
          ...graph_data.nodes,
          inputText: { value: event.message.text }   // ← ここだけ差し替え
        }
      },
      agents
    );
    
    const output = await graph.run();
    
    type Recipe = {
      title: string;
      description: string;
      steps: string[];
    };
    
    // JSON文字列 → オブジェクトに変換
    const recipes: Recipe[] = JSON.parse(output.output);
    
    // LINE 返信用に整形
    const messageText = recipes.map((recipe, index) => {
      const steps = recipe.steps.map((step, i) => `  ${i + 1}. ${step}`).join('\n');
      return `【${index + 1}. ${recipe.title}】\n${recipe.description}\n${steps}`;
    }).join('\n\n');

    console.log(typeof messageText);


    /* 返信 */
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{ type: "text", text: messageText }],
      
    });

    res.status(200).end();
  }
);

// サーバー起動
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Local LINE bot on ${PORT}`);
});
