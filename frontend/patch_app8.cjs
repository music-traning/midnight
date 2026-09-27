const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldModelEval = `          let lastFrames: number[][] = [];
          let lastOnsets: number[][] = [];
          let lastContours: number[][] = [];

          // Wait for the model evaluation to fully complete
          // BasicPitch calls the callback incrementally, so we just capture the final cumulative data
          await basicPitch.evaluateModel(
            monoData,
            (frames: number[][], onsets: number[][], contours: number[][]) => {
              lastFrames = frames;
              lastOnsets = onsets;
              lastContours = contours;
            },
            (percent: number) => {}
          );`;

const newModelEval = `          console.log(\`[DEBUG] Audio buffer decoded. Duration: \${audioBuffer.duration}s\`);
          const lastFrames: number[][] = [];
          const lastOnsets: number[][] = [];
          const lastContours: number[][] = [];

          await basicPitch.evaluateModel(
            monoData,
            (frames: number[][], onsets: number[][], contours: number[][]) => {
              lastFrames.push(...frames);
              lastOnsets.push(...onsets);
              lastContours.push(...contours);
            },
            (percent: number) => {}
          );`;

if (code.includes(oldModelEval)) {
    code = code.replace(oldModelEval, newModelEval);
} else {
    console.error("Could not find BasicPitch block");
    process.exit(1);
}

const oldDeduplicated = `          const deduplicated: typeof thresholdFiltered = [];
          for (const note of thresholdFiltered) {`;
          
const newDeduplicated = `          const deduplicated: typeof thresholdFiltered = [];
          for (const note of thresholdFiltered) {`;

// Just add console log before setTheoryNotesState
const oldSetTheory = `          setTheoryNotesState(theoryNotes);`;
const newSetTheory = `          console.log(\`[DEBUG] 抽出された総ノート数 (deduplicated): \${theoryNotes.length}\`);
          setTheoryNotesState(theoryNotes);`;

if (code.includes(oldSetTheory)) {
    code = code.replace(oldSetTheory, newSetTheory);
}

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("BasicPitch chunk appending and logs applied.");
