import { Observable, OperatorFunction } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';
import * as XRegExp from 'xregexp';
import { distinct } from './distinct';

const regNonWordOrSpace = XRegExp("[^\\p{L}\\p{M}' _]+", 'gi');
const regExpRepeatChars = /(.)\1{3,}/i;
const regExpMatchAccents = XRegExp('[\\p{M}]', 'g');

export const flagAccentsRemoved = '~'; // '~';
export const flagToLowerCase = '^'; // '^';

const maxDistinctSize = 50000;

export function normalizeEntries(
    lines: Observable<string>,
    normalizeCase: boolean,
    normalizeAccents: boolean,
) {

    const operations: OperatorFunction<string, string>[] = [concatMap(lineToWords)];

    if (normalizeCase) { operations.push(concatMap(caseNormalizer(flagToLowerCase))); }
    if (normalizeAccents)  { operations.push(concatMap(accentNormalizer(flagAccentsRemoved))); }

    operations.push(filter(distinct(maxDistinctSize)));
    return operations.reduce((acc, op) => acc.pipe(op), lines);
}

export function lineToWords(line: string): string[] {
    // Remove punctuation and non-letters.
    return extractWordGroups(line.normalize('NFC'))
        .filter(s => !regExpRepeatChars.test(s));
}

function accentNormalizer(prefixFlagAccentsRemoved: string) {
    return function* normalizeAccent(word: string) {
        const noAccent = removeAccents(word);
        yield word;
        if (noAccent !== word) yield prefixFlagAccentsRemoved + noAccent;
    };
}

function caseNormalizer(prefixFlagToLowerCase: string ) {
    return function* normalizeCase(word: string) {
        const lower = word.toLowerCase();
        yield word;
        if (lower !== word) yield prefixFlagToLowerCase + lower;
    };
}

export function removeAccents(word: string): string {
    return XRegExp.replace(word.normalize('NFD'), regExpMatchAccents, '');
}

export function extractWordGroups(line: string): string[] {
    return line.replace(regNonWordOrSpace, '|').split('|')
        .map(a => a.trim())
        .filter(a => !!a);
}

