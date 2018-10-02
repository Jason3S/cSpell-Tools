// cSpell:ignore jpegs outing dirs lcode
// cSpell:enableCompoundWords

import { expect } from 'chai';
import { compileWordList, compileTrie } from './wordListCompiler';
import { normalizeWordsToTrie } from './wordListCompiler';
import { normalizeEntries } from './normalization';
import * as fsp from 'fs-extra';
import * as Trie from 'cspell-trie';
import * as path from 'path';
import { from } from 'rxjs';
import { take, toArray } from 'rxjs/operators';

describe('Validate the wordListCompiler', function() {
    it('test reading and normalizing a file', () => {
        const sourceName = path.join(__dirname, '..', '..', 'Samples', 'cities.txt');
        const destName = path.join(__dirname, '..', '..', 'temp', 'cities.txt');
        return compileWordList(sourceName, destName)
        .then(() => fsp.readFile(destName, 'utf8'))
        .then(output => {
            expect(output).to.be.equal(citiesResult);
        });
    });

    it('test compiling to a file without split', () => {
        const sourceName = path.join(__dirname, '..', '..', 'Samples', 'cities.txt');
        const destName = path.join(__dirname, '..', '..', 'temp', 'cities2.txt');
        return compileWordList(sourceName, destName)
        .then(() => fsp.readFile(destName, 'utf8'))
        .then(output => {
            expect(output).to.be.equal(cities);
        });
    });

    it('tests normalized to a trie', () => {
        const words = citiesResult.split('\n');
        const nWords = normalizeEntries(from(words)).pipe(toArray()).toPromise();
        const tWords = normalizeWordsToTrie(from(words))
            .then(node => Trie.iteratorTrieWords(node))
            .then(seq => [...seq]);
        return Promise.all([nWords, tWords])
            .then(([nWords, tWords]) => {
                expect(tWords.sort()).to.be.deep.equal([...(new Set(nWords.sort()))]);
            });
    });

    it('test reading and normalizing to a trie file', () => {
        const sourceName = path.join(__dirname, '..', '..', 'Samples', 'cities.txt');
        const destName = path.join(__dirname, '..', '..', 'temp', 'cities.trie');
        return compileTrie(sourceName, destName)
        .then(() => fsp.readFile(destName, 'UTF-8'))
        .then(output => output.split('\n'))
        .then(words => {
            return Trie.importTrieRx(from(words)).pipe(take(1)).toPromise()
            .then(node => {
                expect([...Trie.iteratorTrieWords(node)].sort()).to.be.deep
                    .equal(citiesResult.split('\n').filter(a => !!a).sort());
            });
        });
    });
});

const cities = `\
New York
New Amsterdam
Los Angeles
San Francisco
New Delhi
Mexico City
London
Paris
`;

const citiesResult = `\
New York
new york
new
york
new amsterdam
amsterdam
los angeles
los
angeles
san francisco
san
francisco
new delhi
delhi
mexico city
mexico
city
london
paris
`;
