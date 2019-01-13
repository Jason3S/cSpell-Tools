import { expect } from 'chai';
import * as rxStream from './rxStreams';
import * as stream from 'stream';
import { from, zip } from 'rxjs';
import { reduce, toArray, map, take, skip } from 'rxjs/operators';
import * as path from 'path';
import * as fs from 'fs-extra';

describe('Validate the rxStreams', () => {

    const pathCitiesFile = path.join(__dirname, '..', '..', 'Samples', 'cities.txt');
    const pathHunspellSample = path.join(__dirname, '..', '..', 'Samples', 'Dutch.aff');

    it('tests stream to Rx', () => {
        const data: string = 'This is a bit of text to have some fun with';
        const bufferStream = new stream.PassThrough();
        bufferStream.end(data);
        return rxStream.streamToStringRx(bufferStream)
            .pipe(reduce((a, b) => a + b))
            .toPromise()
            .then(result => {
                expect(result).to.equal(data);
            });
    });

    it('tests Rx to stream', () => {
        const data: string = 'This is a bit of text to have some fun with';
        const rxObs = from(data.split(' '));
        const stream = rxStream.observableToStream(rxObs);

        return rxStream.streamToStringRx(stream)
            .pipe(reduce((a, b) => a + ' ' + b))
            .toPromise()
            .then(result => {
                expect(result).to.equal(data);
            });
    });

    it('loads a file to make sure they match', () => {
        const pFile = fs.readFile(pathCitiesFile, 'UTF-8');
        const rxFile = rxStream.streamWordsFromFile(pathCitiesFile).pipe(toArray(), map(a => a.join('\n'))).toPromise();
        return zip(pFile, rxFile, (expected, actual) => {
            expect(expected).to.be.equal(actual);
        }).toPromise();
    });

    it('loads part of a hunspell file.', () => {
        return rxStream.streamWordsFromFile(pathHunspellSample).pipe(skip(50000), take(10), toArray()).toPromise().then(words => {
            expect(words).to.deep.equal([
                'droevig',
                'droevige',
                'droeviger',
                'droevigere',
                'droevigst',
                'droevigste',
                'droezig',
                'droezige',
                'drogbeeld',
                'drogbeelden',
            ]);
        });
    });
});