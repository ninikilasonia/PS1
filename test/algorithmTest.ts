import assert from "assert";
import { AnswerDifficulty, Flashcard } from "../src/flashcards";
import {
    toBucketSets,
    getBucketRange,
    practice,
    update,
    getHint,
    computeProgress,
} from "../src/algorithm";

describe("toBucketSets()", () => {
    it("converts empty map to empty array", () => {
        const input = new Map<number, Set<Flashcard>>();
        assert.deepStrictEqual(toBucketSets(input), []);
    });

    it("handles non-contiguous buckets", () => {
        const card = new Flashcard("Q", "A", "hint", []);
        const input = new Map([[2, new Set([card])]]);
        const result = toBucketSets(input);
        assert.strictEqual(result.length, 3);
        assert.deepStrictEqual(result[0], new Set());
        assert.deepStrictEqual(result[1], new Set());
        assert.deepStrictEqual(result[2], new Set([card]));
    });
});

describe("getBucketRange()", () => {
    it("returns undefined for no cards", () => {
        assert.strictEqual(getBucketRange([new Set(), new Set()]), undefined);
    });

    it("returns min and max buckets", () => {
        const card1 = new Flashcard("Q1", "A1", "", []);
        const card3 = new Flashcard("Q3", "A3", "", []);
        const buckets = [new Set([card1]), new Set(), new Set([card3])];
        assert.deepStrictEqual(getBucketRange(buckets), { minBucket: 0, maxBucket: 2 });
    });
});

describe("practice()", () => {
    it("includes bucket 0 every day", () => {
        const card = new Flashcard("Q", "A", "", []);
        const buckets = [new Set([card])];
        assert.deepStrictEqual(practice(buckets, 1), new Set([card]));
    });

    it("excludes retired bucket 5", () => {
        const card = new Flashcard("Q", "A", "", []);
        const buckets = Array(6).fill(new Set()).map((_, i) => i === 5 ? new Set([card]) : new Set());
        assert.deepStrictEqual(practice(buckets, 0), new Set());
    });
});

describe("update()", () => {
    it("moves wrong answers to bucket 0", () => {
        const card = new Flashcard("Q", "A", "", []);
        const buckets = new Map([[3, new Set([card])]]);
        const updated = update(buckets, card, AnswerDifficulty.Wrong);
        assert(updated.get(0)?.has(card));
    });

    it("retains retired cards on easy", () => {
        const card = new Flashcard("Q", "A", "", []);
        const buckets = new Map([[5, new Set([card])]]);
        const updated = update(buckets, card, AnswerDifficulty.Easy);
        assert(updated.get(5)?.has(card));
    });
});

describe("getHint()", () => {
    it("generates language hint", () => {
        const card = new Flashcard("", "test", "", ["language"]);
        assert.strictEqual(getHint(card), "t___");
    });

    it("uses original hint for other tags", () => {
        const card = new Flashcard("", "", "math hint", ["math"]);
        assert.strictEqual(getHint(card), "math hint");
    });
});

describe("computeProgress()", () => {
    it("calculates progress stats", () => {
        const card = new Flashcard("Q", "A", "", []);
        const buckets = new Map([[0, new Set([card])]]);
        const history = [{ card, date: new Date(), difficulty: AnswerDifficulty.Easy }];
        const stats = computeProgress(buckets, history);
        assert.strictEqual(stats.total, 1);
        assert.deepStrictEqual(stats.buckets, [1]);
        assert.strictEqual(stats.averagePractices, 1);
    });

    it("throws on empty history", () => {
        assert.throws(() => computeProgress(new Map(), []));
    });
});