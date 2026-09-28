export const BPM = 120;
export const BEAT_DUR = 60.0 / BPM;
export const BAR_DUR = BEAT_DUR * 4;

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

export function calculateScore(theoryNotes: any[]) {
  if (theoryNotes.length === 0) return 0;
  let rhythmScore = 0;
  let theoryScore = 0;
  theoryNotes.forEach(n => {
    const time = parseFloat(n.startTime);
    const nearestBeat = Math.round(time / BEAT_DUR) * BEAT_DUR;
    const diff = Math.abs(time - nearestBeat);
    const rScore = Math.max(0, 1.0 - (diff / (BEAT_DUR / 2)));
    rhythmScore += rScore;
    const d = n.degree;
    if (['1', '3', '5', 'b7', 'M7', 'b3'].includes(d)) theoryScore += 1.0;
    else if (['9', '11', '13', '#11/b5', 'b9', 'b13'].includes(d)) theoryScore += 0.8;
    else theoryScore += 0.3;
  });
  const rFinal = Math.round((rhythmScore / theoryNotes.length) * 40);
  const tFinal = Math.round((theoryScore / theoryNotes.length) * 60);
  return rFinal + tFinal;
}
