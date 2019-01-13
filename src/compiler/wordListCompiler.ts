import { writeToFileRxP} from 'cspell-lib';
import { Observable, zip, from } from 'rxjs';
import { reduce, map, bufferCount, take, concatMap, tap } from 'rxjs/operators';
import * as path from 'path';
import { mkdirp } from 'fs-extra';
import * as Trie from 'cspell-trie';
import { normalizeEntries } from './normalization';
import { streamWordsFromFile } from './rxStreams';

export interface CompileOptions {
    normalizeCase: boolean;
    normalizeAccents: boolean;
    limit?: number;
}

export function compileWordList(filename: string, destFilename: string, options: CompileOptions): Promise<void> {
    const destDir = path.dirname(destFilename);
    const entries = normalizeEntries(
        streamWordsFromFile(filename),
        options.normalizeCase,
        options.normalizeAccents
    );
    const finalEntries = (options.limit ? entries.pipe(take(options.limit)) : entries);
    return mkdirp(destDir).then(() => writeToFileRxP(destFilename, finalEntries.pipe(
        map(a => a + '\n'),
        bufferCount(1024),
        map(a => a.join('')),
    )));
}

export function normalizeWordsToTrie(words: Observable<string>): Promise<Trie.TrieNode> {
    const result = normalizeEntries(words, false, false)
        .pipe(reduce((node: Trie.TrieNode, word: string) => Trie.insert(word, node), {} as Trie.TrieNode))
        .toPromise();
    return result;
}

export function compileWordListToTrieFile(words: Observable<string>, destFilename: string): Promise<void> {
    const pDir = mkdirp(path.dirname(destFilename));
    const root = normalizeWordsToTrie(words);

    const data = zip(pDir, root, (_: void, b: Trie.TrieNode) => b).pipe(
        map(node => Trie.serializeTrie(node, { base: 16, comment: 'Built by cspell-tools.' })),
        concatMap(seq => from(seq)),
    );

    return writeToFileRxP(destFilename, data.pipe(bufferCount(1024), map(a => a.join(''))));
}

export function compileTrie(filename: string, destFilename: string): Promise<void> {
    return compileWordListToTrieFile(streamWordsFromFile(filename), destFilename);
}
