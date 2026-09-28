import { describe, it, expect } from 'vitest';
import { getProgressionForKey, getChordForTime, getDegree, calculateScore, analyzeNote, getNoteCategory, BPM, BEAT_DUR, BAR_DUR } from './theory';

describe('theory logic', () => {
  it('getProgressionForKey', () => {
    expect(getProgressionForKey('C')).toEqual(['Dm7', 'G7', 'Cmaj7']);
    expect(getProgressionForKey('F')).toEqual(['Gm7', 'C7', 'Fmaj7']);
    expect(getProgressionForKey('Unknown')).toEqual(['Dm7', 'G7', 'Cmaj7']);
  });

  it('getChordForTime', () => {
    expect(getChordForTime(0, 'C')).toBe('Dm7');
    expect(getChordForTime(1.9, 'C')).toBe('Dm7');
    expect(getChordForTime(2.0, 'C')).toBe('G7');
    expect(getChordForTime(3.9, 'C')).toBe('G7');
    expect(getChordForTime(4.0, 'C')).toBe('Cmaj7');
    expect(getChordForTime(5.9, 'C')).toBe('Cmaj7');
    expect(getChordForTime(8.0, 'C')).toBe('Dm7');
  });

  it('getDegree', () => {
    expect(getDegree(0, 'Cmaj7')).toBe('1');
    expect(getDegree(4, 'Cmaj7')).toBe('3');
    expect(getDegree(7, 'Cmaj7')).toBe('5');
    expect(getDegree(5, 'Dm7')).toBe('b3');
    expect(getDegree(0, 'Unknown')).toBe('?');
  });

  it('getNoteCategory', () => {
    // m7
    expect(getNoteCategory('Dm7', '1')).toBe('CT');
    expect(getNoteCategory('Dm7', 'b3')).toBe('CT');
    expect(getNoteCategory('Dm7', '11')).toBe('TENSION');
    expect(getNoteCategory('Dm7', 'b13')).toBe('AVOID');
    expect(getNoteCategory('Dm7', 'M7')).toBe('OUT');

    // 7
    expect(getNoteCategory('G7', '3')).toBe('CT');
    expect(getNoteCategory('G7', '13')).toBe('TENSION');
    expect(getNoteCategory('G7', 'b9')).toBe('TENSION');
    expect(getNoteCategory('G7', '11')).toBe('AVOID');
    expect(getNoteCategory('G7', 'M7')).toBe('OUT');

    // maj7
    expect(getNoteCategory('Cmaj7', 'M7')).toBe('CT');
    expect(getNoteCategory('Cmaj7', '9')).toBe('TENSION');
    expect(getNoteCategory('Cmaj7', '11')).toBe('AVOID');
    expect(getNoteCategory('Cmaj7', 'b7')).toBe('OUT');
  });

  it('analyzeNote enrich properties correctly', () => {
    const note = {
      startTime: '0.0', // Beat 0
      duration: '0.5',
      currentChord: 'Dm7',
      degree: '1'
    };
    
    const analyzed = analyzeNote(note);
    expect(analyzed.barNumber).toBe(1);
    expect(analyzed.beatPosition).toBe(0);
    expect(analyzed.category).toBe('CT');
    expect(analyzed.isOnGrid).toBe(true);
    expect(analyzed.rScore).toBe(1);
    expect(analyzed.theoryScore).toBe(1.0);
  });

  it('calculateScore calculates totals and handles density penalty', () => {
    expect(calculateScore([])).toBe(0);

    const manyNotes = Array.from({ length: 8 }).map((_, i) => ({
      startTime: (i * 0.5).toString(),
      duration: '0.2',
      currentChord: 'Cmaj7',
      degree: '1' // CT
    }));

    // 8 notes => densityRatio = 1.0. All perfect grid, all CT.
    expect(calculateScore(manyNotes)).toBe(100);

    const fewNotes = [
      { startTime: '0.0', duration: '0.2', currentChord: 'Cmaj7', degree: '1' }
    ];
    // 1 note => densityRatio = 1/8.
    // Score would be 100, but with density it is 100 * (1/8) = 12.5 -> 13
    expect(calculateScore(fewNotes)).toBe(13);
  });
});
