import { lineReaderRx } from './fileReader';
import { Observable, from } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import * as HR from 'hunspell-reader';

export * from 'rxjs-stream';
export {rxToStream as observableToStream} from 'rxjs-stream';

const regHunspellFile = /\.(dic|aff)$/i;

export function readHunspellFiles(filename: string): Observable<string> {
    const dicFile = filename.replace(regHunspellFile, '.dic');
    const affFile = filename.replace(regHunspellFile, '.aff');

    const reader = HR.HunspellReader.createFromFiles(affFile, dicFile);

    const r = from(reader).pipe(
        concatMap(reader => reader.readWordsRx()),
        map(aff => aff.word),
    );
    return r;
}

export function streamWordsFromFile(filename: string): Observable<string> {
    return regHunspellFile.test(filename) ? readHunspellFiles(filename) : lineReaderRx(filename);
}
