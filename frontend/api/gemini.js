import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, payload, language = "ja" } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured on server' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-3.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });

  try {
    let prompt = '';
    
    if (type === 'chat') {
      prompt = `あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。ユーザーからのメッセージに対して、愛のある辛口なトーンで150文字以内で語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。
返答は必ず以下のJSONスキーマに従ってください。
{
  "expression": "neutral" | "smile" | "think" | "point",
  "message": "純粋なセリフのみ"
}

ユーザーの言葉: ${payload}`;
    } else if (type === 'evaluate') {
      prompt = `あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。
以下はユーザーが連続して弾いた最大4周分（1周=2-5-1進行）のギターソロデータです。

【データ概要】
ループ数: ${payload.length}
各ループのデータ:
${JSON.stringify(payload)}

【指示】
各ループに対して、JSONスキーマに従い、必ず2, 5, 1それぞれのコードでのプレイを分析した上でセリフを生成してください。
1. 「analysis_2」「analysis_5」「analysis_1」の各フィールドで、それぞれのコードにおいてユーザーが実際に弾いた度数（degree）をデータから読み取り、絶対に省略せずに言語化してください。
2. 抽象的なごまかしは許されません。渡されたデータに該当コードのノートが存在しない場合は「弾いていない」と厳しく指摘してください。
3. 最終的な「message」フィールドは、上記3つの分析結果を統合し、「2のコードでは〜、だが5のコードで〜し、最後の1への着地は〜だった」のように、3つのコードすべてに具体的に言及したセリフにしてください。
4. 全体の展開（起承転結）を踏まえた自然な語り口で、愛のある辛口なトーン（日本語）を徹底してください。

【出力JSONスキーマ】
[
  {
    "loop": ループ番号,
    "score": ループのスコア(提供された数値をそのまま返すこと),
    "analysis_2": "最初の2のコード（例: Dm7）部分で弾かれた度数とアプローチの具体的な分析",
    "analysis_5": "2番目の5のコード（例: G7）部分でのテンションの有無や具体的なプレイの分析",
    "analysis_1": "最後の1のコード（例: Cmaj7）部分への解決の美しさの分析",
    "expression": "neutral" | "smile" | "think" | "point",
    "message": "上記3つの分析結果（analysis_2, 5, 1）を必ず全て盛り込み、自然に繋ぎ合わせたマスターの愛のある辛口セリフ"
  }
]`;
    }

    
    const langRule = language === 'en'
      ? "\n\n**CRITICAL INSTRUCTION: You MUST output your entire response in English. Use cool, natural Jazz slang and native English phrasing.**"
      : "\n\n**CRITICAL INSTRUCTION: 日本語で出力してください。**";
    prompt += langRule;
    
    const result = await model.generateContent(prompt);
    let rawText = result.response.text().replace(/```json/gi, '').replace(/```/g, '').trim();
    const data = JSON.parse(rawText);
    
    return res.status(200).json(data);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: 'Failed to generate content' });
  }
}
