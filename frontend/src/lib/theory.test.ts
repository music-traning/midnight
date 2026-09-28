import { describe, it, expect } from 'vitest';
import { getProgressionForKey, getChordForTime, getDegree, calculateScore, BPM, BEAT_DUR, BAR_DUR } from './theory';

describe('theory', () => {
  it('getProgressionForKey', () => {
    expect(getProgressionForKey('C')).toEqual(['Dm7', 'G7', 'Cmaj7']);
    expect(getProgressionForKey('F')).toEqual(['Gm7', 'C7', 'Fmaj7']);
    // Fallback
    expect(getProgressionForKey('Unknown')).toEqual(['Dm7', 'G7', 'Cmaj7']);
  });

  it('getChordForTime', () => {
    // BAR_DUR for 120 BPM is 2.0s
    expect(getChordForTime(0, 'C')).toBe('Dm7');
    expect(getChordForTime(1.9, 'C')).toBe('Dm7');
    expect(getChordForTime(2.0, 'C')).toBe('G7');
    expect(getChordForTime(3.9, 'C')).toBe('G7');
    expect(getChordForTime(4.0, 'C')).toBe('Cmaj7');
    expect(getChordForTime(5.9, 'C')).toBe('Cmaj7');
    // loops at 8.0 (BAR_DUR * 4)
    expect(getChordForTime(8.0, 'C')).toBe('Dm7');
  });

  it('getDegree', () => {
    // C = 0
    expect(getDegree(0, 'Cmaj7')).toBe('1');
    expect(getDegree(4, 'Cmaj7')).toBe('3');
    expect(getDegree(7, 'Cmaj7')).toBe('5');
    // Dm7 root = D (2)
    // Note F (5) => 5 - 2 = 3 => 'b3'
    expect(getDegree(5, 'Dm7')).toBe('b3');
    // Unknown root
    expect(getDegree(0, 'Unknown')).toBe('?');
  });

  it('calculateScore', () => {
    expect(calculateScore([])).toBe(0);

    // Perfect timing (diff = 0 -> rScore = 1) and perfect degree ('1' -> tScore = 1)
    const notes = [
      { startTime: '0.0', degree: '1' },
      { startTime: '0.5', degree: '3' }, // BEAT_DUR is 0.5
    ];
    // rScore = 1 * 2 = 2. rFinal = 2/2 * 40 = 40
    // tScore = 1 * 2 = 2. tFinal = 2/2 * 60 = 60
    expect(calculateScore(notes)).toBe(100);

    // Bad timing, bad degree
    const badNotes = [
      { startTime: '0.25', degree: '?' } // halfway between beats (max diff 0.25 -> rScore 0)
    ];
    // rScore = 0. rFinal = 0/1 * 40 = 0
    // tScore = 0.3. tFinal = Math.round(0.3 / 1 * 60) = 18
    expect(calculateScore(badNotes)).toBe(18);
  });
});
