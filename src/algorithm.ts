/**
 * Problem Set 1: Flashcards - Algorithm Functions
 *
 * This file contains the implementations for the flashcard algorithm functions
 * as described in the problem set handout.
 *
 * Please DO NOT modify the signatures of the exported functions in this file,
 * or you risk failing the autograder.
 */

import { Flashcard, AnswerDifficulty, BucketMap } from "./flashcards";

/**
 * Converts a Map representation of learning buckets into an Array-of-Set representation.
 *
 * @param buckets Map where keys are bucket numbers and values are sets of Flashcards.
 * @returns Array of Sets, where element at index i is the set of flashcards in bucket i.
 *          Buckets with no cards will have empty sets in the array.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function toBucketSets(buckets: BucketMap): Array<Set<Flashcard>> {
  if (buckets.size === 0) return [];
  const maxBucket = Math.max(...buckets.keys());
  const result: Array<Set<Flashcard>> = [];
  for (let i = 0; i <= maxBucket; i++) {
      result.push(buckets.has(i) ? new Set(buckets.get(i)) : new Set());
  }
  return result;
}

/**
 * Finds the range of buckets that contain flashcards, as a rough measure of progress.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @returns object with minBucket and maxBucket properties representing the range,
 *          or undefined if no buckets contain cards.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function getBucketRange(
  buckets: Array<Set<Flashcard>>
): { minBucket: number; maxBucket: number } | undefined {
  const nonEmpty: number[] = [];
  buckets.forEach((set, index) => {
      if (set.size > 0) nonEmpty.push(index);
  });
  if (nonEmpty.length === 0) return undefined;
  return {
      minBucket: Math.min(...nonEmpty),
      maxBucket: Math.max(...nonEmpty)
  };
}

/**
 * Selects cards to practice on a particular day.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @param day current day number (starting from 0).
 * @returns a Set of Flashcards that should be practiced on day `day`,
 *          according to the Modified-Leitner algorithm.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function practice(
  buckets: Array<Set<Flashcard>>,
  day: number
): Set<Flashcard> {
  const result = new Set<Flashcard>();
  const retiredBucket = 5;
  for (let i = 0; i < buckets.length; i++) {
      if (i === retiredBucket) continue;
      const interval = 2 ** i;
      if (day % interval === 0) {
          buckets[i]?.forEach(card => result.add(card));
      }
  }
  return result;
}

/**
 * Updates a card's bucket number after a practice trial.
 *
 * @param buckets Map representation of learning buckets.
 * @param card flashcard that was practiced.
 * @param difficulty how well the user did on the card in this practice trial.
 * @returns updated Map of learning buckets.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function update(
  buckets: BucketMap,
  card: Flashcard,
  difficulty: AnswerDifficulty
): BucketMap {
    const newMap = new Map(buckets);
    let currentBucket: number | undefined;

    for (const [bucket, cards] of newMap) {
        if (cards.has(card)) {
            currentBucket = bucket;
            cards.delete(card);
            if (cards.size === 0) newMap.delete(bucket);
            break;
        }
    }

    if (currentBucket === undefined) return newMap;

    let newBucket: number;
    switch (difficulty) {
        case AnswerDifficulty.Wrong:
            newBucket = 0;
            break;
        case AnswerDifficulty.Easy:
            newBucket = currentBucket === 5 ? currentBucket : currentBucket + 1;
            break;
        case AnswerDifficulty.Hard:
            newBucket = Math.max(0, currentBucket - 1);
            break;
    }

    if (!newMap.has(newBucket)) newMap.set(newBucket, new Set());
    newMap.get(newBucket)!.add(card);
    return newMap;
}

/**
 * Generates a hint for a flashcard.
 *
 * @param card flashcard to hint
 * @returns a hint for the front of the flashcard.
 * @spec.requires card is a valid Flashcard.
 */
export function getHint(card: Flashcard): string {
  if (card.tags.includes("language")) {
    const letters = card.back.replace(/\s/g, '').split('');
    return letters.length === 0 ? '' : 
        letters[0] + '_'.repeat(letters.length - 1);
  }
  return card.hint;
}

/**
 * Computes statistics about the user's learning progress.
 *
 * @param buckets representation of learning buckets.
 * @param history representation of user's answer history.
 * @returns statistics about learning progress.
 * @spec.requires [SPEC TO BE DEFINED]
 */
export function computeProgress(buckets: BucketMap,
  history: Array<{ card: Flashcard; date: Date; difficulty: AnswerDifficulty }>):  { total: number; buckets: number[]; averagePractices: number } {
  if (history.length === 0) throw new Error("History must not be empty");
  const total = Array.from(buckets.values()).reduce((sum, set) => sum + set.size, 0);
  const bucketCounts: number[] = [];
  const maxBucket = Math.max(...buckets.keys(), 0);
  for (let i = 0; i <= maxBucket; i++) {
      bucketCounts.push(buckets.get(i)?.size ?? 0);
  }
  const practiceCounts = new Map<Flashcard, number>();
  history.forEach(entry => {
      practiceCounts.set(entry.card, (practiceCounts.get(entry.card) ?? 0) + 1);
  });
  const totalPractices = Array.from(practiceCounts.values()).reduce((a, b) => a + b, 0);
  const average = total === 0 ? 0 : totalPractices / total;
  return { total, buckets: bucketCounts, averagePractices: average };
}
