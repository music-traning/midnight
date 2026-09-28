import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

const MAX_CHAT_LENGTH = 300;
const MAX_EVAL_NOTES = 200;

const SYSTEM_PROMPT_JA = `あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。ユーザーからのメッセージに対して、愛のある辛口なトーンで語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。`;
const SYSTEM_PROMPT_EN = `You are the cool, slightly cynical master of a dark-toned jazz bar and an expert bebop guitarist. Speak to the user with tough love and cool jazz slang. Avoid artificial AI greetings or list formats. Output pure dialogue only.`;

const CHAT_RULES_JA = `ユーザーの言葉に対して150文字以内で返答してください。`;
const CHAT_RULES_EN = `Respond to the user's input in under 150 characters.`;

const EVAL_RULES_JA = `ユーザーが連続して弾いた2-5-1進行のギターソロデータが渡されます。各ループに対して、2, 5, 1それぞれのコードでのプレイを分析した上でセリフを生成してください。
1. 「analysis_2」「analysis_5」「analysis_1」のフィールドで、それぞれのコードにおいてユーザーが実際に弾いた度数（degree）と判定（category: CT/TENSION/AVOID/OUT）をデータから読み取り、具体的に言及してください。
2. 渡されたデータに該当コードのノートが存在しない場合は「弾いていない」と厳しく指摘してください。
3. 最終的な「message」フィールドは、上記3つの結果を統合し、全コードに言及した自然な語り口で、愛のある辛口セリフにしてください。`;

const EVAL_RULES_EN = `You will receive data for a 2-5-1 guitar solo. For each loop, analyze the play for the 2, 5, and 1 chords.
1. In 'analysis_2', 'analysis_5', 'analysis_1', explicitly mention the degrees played and their categories (CT/TENSION/AVOID/OUT).
2. If no notes exist for a chord, strictly point out that they didn't play anything.
3. In 'message', combine these findings into a natural, tough-love dialogue mentioning all chords.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body' });
  }

  const { type, payload, language = "ja" } = req.body;

  if (type !== 'chat' && type !== 'evaluate') {
    return res.status(400).json({ error: 'Invalid type' });
  }

  // 1. Strict Validation & Sanitization
  let safePayload;
  try {
    if (type === 'chat') {
      if (typeof payload !== 'string') throw new Error("Chat payload must be string");
      safePayload = payload.trim();
      if (safePayload.length === 0 || safePayload.length > MAX_CHAT_LENGTH) {
        throw new Error(`Chat length must be 1-${MAX_CHAT_LENGTH}`);
      }
    } else {
      if (!Array.isArray(payload) || payload.length === 0 || payload.length > 4) {
        throw new Error("Eval payload must be array of 1-4 loops");
      }
      safePayload = payload.map(p => {
        if (typeof p.loop !== 'number' || typeof p.score !== 'number' || p.score < 0 || p.score > 100) {
          throw new Error("Invalid loop or score");
        }
        if (!Array.isArray(p.notes) || p.notes.length > MAX_EVAL_NOTES) {
          throw new Error(`Notes array must be 0-${MAX_EVAL_NOTES}`);
        }
        const safeNotes = p.notes.map(n => ({
          chord: String(n.chord || '').substring(0, 10),
          note: String(n.note || '').substring(0, 5),
          degree: String(n.degree || '').substring(0, 10),
          bar: Number(n.bar) || 0,
          beat: Number(n.beat) || 0,
          duration: Number(n.duration) || 0,
          category: String(n.category || '').substring(0, 10)
        }));
        return { loop: p.loop, score: p.score, notes: safeNotes };
      });
    }
  } catch (validationErr) {
    return res.status(400).json({ error: 'Validation Error', details: validationErr.message });
  }

  // 2. Setup Gemini AI
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API key not configured");
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const isEn = language === 'en';
    const basePersona = isEn ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_JA;
    const taskRules = type === 'chat' 
      ? (isEn ? CHAT_RULES_EN : CHAT_RULES_JA) 
      : (isEn ? EVAL_RULES_EN : EVAL_RULES_JA);
      
    const systemInstruction = `${basePersona}\n\n${taskRules}`;

    const chatSchema = {
       type: SchemaType.OBJECT,
       properties: {
         expression: { type: SchemaType.STRING, enum: ['neutral', 'smile', 'think', 'point'] },
         message: { type: SchemaType.STRING }
       },
       required: ['expression', 'message']
    };

    const evaluateSchema = {
       type: SchemaType.ARRAY,
       items: {
         type: SchemaType.OBJECT,
         properties: {
           loop: { type: SchemaType.INTEGER },
           score: { type: SchemaType.INTEGER },
           analysis_2: { type: SchemaType.STRING },
           analysis_5: { type: SchemaType.STRING },
           analysis_1: { type: SchemaType.STRING },
           expression: { type: SchemaType.STRING, enum: ['neutral', 'smile', 'think', 'point'] },
           message: { type: SchemaType.STRING }
         },
         required: ['loop', 'score', 'analysis_2', 'analysis_5', 'analysis_1', 'expression', 'message']
       }
    };

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
      generationConfig: { 
        responseMimeType: "application/json",
        responseSchema: type === 'chat' ? chatSchema : evaluateSchema,
        temperature: 0.7,
        maxOutputTokens: type === 'chat' ? 200 : 1000
      }
    });

    // Generate Content
    let promptText = "";
    if (type === 'chat') {
      promptText = `ユーザーの言葉: ${safePayload}`;
    } else {
      promptText = `【データ概要】ループ数: ${safePayload.length}\n【データ】\n${JSON.stringify(safePayload)}`;
    }

    const result = await model.generateContent(promptText);
    let rawText = result.response.text().trim();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (e) {
      throw new Error("Invalid JSON response from Gemini");
    }

    // 3. Output Validation
    const validExpressions = ['neutral', 'smile', 'think', 'point'];
    if (type === 'chat') {
      if (!validExpressions.includes(data.expression)) data.expression = 'neutral';
      if (data.message && data.message.length > 500) data.message = data.message.substring(0, 500) + '...';
    } else {
      if (Array.isArray(data)) {
        data = data.map(d => {
          if (!validExpressions.includes(d.expression)) d.expression = 'neutral';
          if (d.message && d.message.length > 500) d.message = d.message.substring(0, 500) + '...';
          return d;
        });
      }
    }

    return res.status(200).json(data);

  } catch (error) {
    console.error("[API Gateway Error]:", error);
    return res.status(502).json({ error: 'Upstream processing failed' });
  }
}
