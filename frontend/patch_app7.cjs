const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldPromptBlock = `          const prompt = \`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。
以下はユーザーが連続して弾いた最大4周分（1周=2-5-1進行）のギターソロデータです。

【データ概要】
ループ数: \${allLoopsData.length}
各ループのデータ:
\${JSON.stringify(allLoopsData)}

【指示】
送信されたデータは \${allLoopsData.length} 周分のコード進行です。
各ループに対して個別の評価を行い、必ず送信されたループ数と等しい数の要素を持つJSON配列で返答してください。
ただ独立した評価をするのではなく、「1周目は〜、だが2周目は〜、そして最後は〜」のように、ソロ全体の展開（起承転結）を踏まえた自然な語り口で、愛のある辛口なトーン（日本語）を徹底してください。
特に「5（ドミナント）」におけるテンションの使い方のセンスと、「1（トニック）」への着地（解決）の美しさについて必ず言及してください。

【出力JSONスキーマ】
[
  {
    "expression": "neutral" | "smile" | "think" | "point",
    "message": "純粋なセリフのみ(150文字程度)",
    "score": ループのスコア(提供された数値をそのまま返すこと)
  }
]\`;`;

const newPromptBlock = `          console.log('[DEBUG Phase 8.6] Sending to Gemini:', JSON.stringify(allLoopsData, null, 2));
          const prompt = \`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。
以下はユーザーが連続して弾いた最大4周分（1周=2-5-1進行）のギターソロデータです。

【データ概要】
ループ数: \${allLoopsData.length}
各ループのデータ:
\${JSON.stringify(allLoopsData)}

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
]\`;`;

if (code.includes(oldPromptBlock)) {
    code = code.replace(oldPromptBlock, newPromptBlock);
    fs.writeFileSync('src/App.tsx', code, 'utf8');
    console.log("CoT prompt successfully injected.");
} else {
    console.error("Could not find the target prompt block!");
    process.exit(1);
}
