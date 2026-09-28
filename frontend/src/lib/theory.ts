export const BPM = 120;
export const BEAT_DUR = 60.0 / BPM; // 0.5s
export const BAR_DUR = BEAT_DUR * 4; // 2.0s

export const SCORE_WEIGHTS = {
  CT: 1.0,
  TENSION: 0.8,
  AVOID: 0.4,
  OUT: 0.15
};

export const RHYTHM_TOLERANCE_SEC = 0.07;
export const MIN_NOTES_PER_LOOP = 8; // Penalty applied if fewer than this many notes per 4-bar loop

export function getProgressionForKey(key: string): [string, string, string] {
  const progressions: Record<string, [string, string, string]> = {
    'C': ['Dm7', 'G7', 'Cmaj7'],
    'F': ['Gm7', 'C7', 'Fmaj7'],
    'Bb': ['Cm7', 'F7', 'Bbmaj7'],
    'Eb': ['Fm7', 'Bb7', 'Ebmaj7'],
    'Ab': ['Bbm7', 'Eb7', 'Abmaj7'],
    'Db': ['Ebm7', 'Ab7', 'Dbmaj7'],
    'Gb': ['Abm7', 'Db7', 'Gbmaj7'],
    'B':  ['C#m7', 'F#7', 'Bmaj7'],
    'E':  ['F#m7', 'B7', 'Emaj7'],
    'A':  ['Bm7', 'E7', 'Amaj7'],
    'D':  ['Em7', 'A7', 'Dmaj7'],
    'G':  ['Am7', 'D7', 'Gmaj7']
  };
  return progressions[key] || progressions['C'];
}

export function getChordForTime(timeSec: number, musicKey: string) {
  const prog = getProgressionForKey(musicKey);
  const timeInProg = timeSec % (BAR_DUR * 4);
  if (timeInProg < BAR_DUR) return prog[0];
  if (timeInProg < BAR_DUR * 2) return prog[1];
  return prog[2];
}

export function getDegree(noteMidi: number, chordName: string) {
  const rootStr = chordName.replace(/m7|maj7|7/g, ''); 
  const rootToMidi: Record<string, number> = { 'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11 };
  const rootMidi = rootToMidi[rootStr];
  if (rootMidi === undefined) return '?';
  let diff = (noteMidi - rootMidi) % 12;
  if (diff < 0) diff += 12;
  const degreeMap = ['1', 'b9', '9', 'b3', '3', '11', '#11/b5', '5', 'b13', '13', 'b7', 'M7'];
  return degreeMap[diff];
}

export function getNoteCategory(chordName: string, degree: string): 'CT' | 'TENSION' | 'AVOID' | 'OUT' {
  if (chordName.includes('m7')) {
    if (['1', 'b3', '5', 'b7'].includes(degree)) return 'CT';
    if (['9', '11', '13'].includes(degree)) return 'TENSION';
    if (['b13'].includes(degree)) return 'AVOID';
    return 'OUT';
  } else if (chordName.includes('maj7')) {
    if (['1', '3', '5', 'M7'].includes(degree)) return 'CT';
    if (['9', '#11/b5', '13'].includes(degree)) return 'TENSION';
    if (['11'].includes(degree)) return 'AVOID';
    return 'OUT';
  } else {
    // Dominant 7 (or any other unspecified)
    if (['1', '3', '5', 'b7'].includes(degree)) return 'CT';
    // b3 is equivalent to #9 in this mapping
    if (['9', '13', 'b9', 'b3', '#11/b5', 'b13'].includes(degree)) return 'TENSION';
    if (['11'].includes(degree)) return 'AVOID';
    return 'OUT';
  }
}

export function analyzeNote(n: any) {
  const time = parseFloat(n.startTime);
  const duration = parseFloat(n.duration);
  
  // Local time within the loop (4 bars = 16 beats = 8 seconds)
  const timeInLoop = time % (BAR_DUR * 4);
  const barNumber = Math.floor(timeInLoop / BAR_DUR) + 1; // 1 to 4
  const beatPosition = (timeInLoop % BAR_DUR) / BEAT_DUR; // 0 to 4
  const timeInBeat = time % BEAT_DUR;
  
  const category = getNoteCategory(n.currentChord, n.degree);
  
  // Rhythm Grid Evaluation
  const ratio = timeInBeat / BEAT_DUR; // 0.0 to 1.0
  // valid grids: on beat (0.0, 1.0), 8th note (0.5), swing 8th (2/3)
  const grids = [0.0, 0.5, 2/3, 1.0]; 
  let minDiff = 1.0;
  grids.forEach(g => {
    const diff = Math.abs(ratio - g);
    if (diff < minDiff) minDiff = diff;
  });
  const diffSec = minDiff * BEAT_DUR;
  const isOnGrid = diffSec <= RHYTHM_TOLERANCE_SEC;
  
  let rScore = Math.max(0, 1.0 - (diffSec / RHYTHM_TOLERANCE_SEC));
  
  const isStrongBeat = (Math.abs(beatPosition - 0) < 0.2 || Math.abs(beatPosition - 2) < 0.2);
  const isLong = duration > 0.25; // longer than an 8th note
  
  let theoryScore = SCORE_WEIGHTS[category];
  
  if (category === 'AVOID' || category === 'OUT') {
    if (isStrongBeat || isLong) {
      theoryScore *= 0.5; // Harsher penalty
    } else {
      theoryScore = Math.min(1.0, theoryScore * 1.5); // Lighter penalty for passing tones
    }
  }

  return {
    ...n,
    barNumber,
    beatPosition: parseFloat(beatPosition.toFixed(2)),
    category,
    diffSec,
    isOnGrid,
    rScore,
    theoryScore
  };
}

export function calculateScore(theoryNotes: any[]) {
  if (theoryNotes.length === 0) return 0;
  
  const analyzed = theoryNotes.map(n => n.theoryScore !== undefined ? n : analyzeNote(n));
  
  let rhythmScore = 0;
  let theoryScore = 0;
  
  analyzed.forEach(a => {
    rhythmScore += a.rScore;
    theoryScore += a.theoryScore;
  });
  
  const rFinal = (rhythmScore / analyzed.length) * 40;
  const tFinal = (theoryScore / analyzed.length) * 60;
  
  let total = rFinal + tFinal;
  
  const densityRatio = Math.min(1.0, analyzed.length / MIN_NOTES_PER_LOOP);
  total *= densityRatio;
  
  return Math.round(total);
}
