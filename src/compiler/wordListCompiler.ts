import { lineReaderRx } from './fileReader';
import { writeToFileRxP} from 'cspell-lib';
import { Observable, zip, from } from 'rxjs';
import { flatMap, reduce, map, bufferCount, filter, distinct } from 'rxjs/operators';
import * as path from 'path';
import { mkdirp } from 'fs-extra';
import * as Trie from 'cspell-trie';
import * as HR from 'hunspell-reader';
import { normalizeEntries } from './normalization';

export function compileWordList(filename: string, destFilename: string): Promise<void> {
    const getWords = () => regHunspellFile.test(filename) ? readHunspellFiles(filename) : lineReaderRx(filename);

    const destDir = path.dirname(destFilename);

    return mkdirp(destDir).then(() => writeToFileRxP(destFilename, normalizeEntries(getWords()).pipe(
        map(a => a + '\n'),
        bufferCount(1024),
        map(a => a.join('')),
    )));
}

export function normalizeWordsToTrie(words: Observable<string>): Promise<Trie.TrieNode> {
    const result = normalizeEntries(words)
        .pipe(reduce((node: Trie.TrieNode, word: string) => Trie.insert(word, node), {} as Trie.TrieNode))
        .toPromise();
    return result;
}

export function compileWordListToTrieFile(words: Observable<string>, destFilename: string): Promise<void> {
    const destDir = path.dirname(destFilename);
    const dir = mkdirp(destDir);
    const root = normalizeWordsToTrie(words);

    const data = zip(dir, root, (_: void, b: Trie.TrieNode) => b).pipe(
        map(node => Trie.serializeTrie(node, { base: 16, comment: 'Built by cspell-tools.' })),
        flatMap(seq => from(seq)),
    );

    return writeToFileRxP(destFilename, data.pipe(bufferCount(1024), map(a => a.join(''))));
}

const regHunspellFile = /\.(dic|aff)$/i;

function readHunspellFiles(filename: string): Observable<string> {
    const dicFile = filename.replace(regHunspellFile, '.dic');
    const affFile = filename.replace(regHunspellFile, '.aff');

    const reader = HR.HunspellReader.createFromFiles(affFile, dicFile);

    const r = from(reader).pipe(
        flatMap(reader => reader.readWordsRx()),
        map(aff => aff.word),
    );
    return r;
}

export function compileTrie(filename: string, destFilename: string): Promise<void> {
    const words = regHunspellFile.test(filename) ? readHunspellFiles(filename) : lineReaderRx(filename);
    return compileWordListToTrieFile(words, destFilename);
}
