import { Observable } from 'rxjs';
import { flatMap, distinct } from 'rxjs/operators';
import * as XRegExp from 'xregexp';

const regNonWordOrSpace = XRegExp("[^\\p{L}\\p{M}' _]+", 'gi');
const regExpRepeatChars = /(.)\1{3,}/i;
const regExpMatchAccents = XRegExp('[\\p{M}]', 'g');

export const flagAccentsRemoved = '%'; // '%';
export const flagToLowerCase = '~'; // '~';

export function normalizeEntries(lines: Observable<string>) {
    return lines.pipe(
        flatMap(lineToWords),
        flatMap(normalizeCase),
        flatMap(normalizeAccent),
        distinct()
    );
}

export function lineToWords(line: string): string[] {
    // Remove punctuation and non-letters.
    return extractWordGroups(line.normalize('NFC'))
        .filter(s => !regExpRepeatChars.test(s));
}

function* normalizeAccent(word: string) {
    const noAccent = removeAccents(word);
    yield word;
    if (noAccent !== word) yield flagAccentsRemoved + noAccent;
}

function* normalizeCase(word: string) {
    const lower = word.toLowerCase();
    yield word;
    if (lower !== word) yield flagToLowerCase + lower;
}

export function removeAccents(word: string): string {
    return XRegExp.replace(word.normalize('NFD'), regExpMatchAccents, '');
}

export function extractWordGroups(line: string): string[] {
    return line.replace(regNonWordOrSpace, '|').split('|')
        .map(a => a.trim())
        .filter(a => !!a);
}
