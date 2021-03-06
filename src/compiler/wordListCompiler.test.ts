// cSpell:ignore jpegs outing dirs lcode
// cSpell:enableCompoundWords


import { expect } from 'chai';
import { lineToWords, compileWordList, compileTrie } from './wordListCompiler';
import { normalizeWords, normalizeWordsToTrie } from './wordListCompiler';
import * as fsp from 'fs-extra';
import * as Trie from 'cspell-trie';
import * as path from 'path';
import { from } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { genSequence } from 'gensequence';

describe('Validate the wordListCompiler', function() {
    it('tests splitting lines', () => {
        const line = 'AppendIterator::getArrayIterator';
        expect(lineToWords(line).filter(distinct()).toArray()).to.deep.equal([
            'append',
            'iterator',
            'get',
            'array',
        ]);
        expect(lineToWords('Austin Martin').toArray()).to.deep.equal([
            'austin martin', 'austin', 'martin'
        ]);
        expect(lineToWords('JPEGsBLOBs').filter(distinct()).toArray()).to.deep.equal(['jpegs', 'blobs']);
        expect(lineToWords('CURLs CURLing').filter(distinct()).toArray()).to.deep.equal(['curls curling', 'curls', 'curling']);
        expect(lineToWords('DNSTable Lookup').filter(distinct()).toArray()).to.deep.equal(['dns', 'table', 'lookup']);
        expect(lineToWords('OUTRing').filter(distinct()).toArray()).to.deep.equal(['outring']);
        expect(lineToWords('OUTRings').filter(distinct()).toArray()).to.deep.equal(['outrings']);
        expect(lineToWords('DIRs').filter(distinct()).toArray()).to.deep.equal(['dirs']);
        expect(lineToWords('AVGAspect').filter(distinct()).toArray()).to.deep.equal(['avg', 'aspect']);
        expect(lineToWords('New York').filter(distinct()).toArray()).to.deep.equal(['new york', 'new', 'york']);
        expect(lineToWords('Namespace DNSLookup').filter(distinct()).toArray()).to.deep.equal(['namespace', 'dns', 'lookup']);
        expect(lineToWords('well-educated').filter(distinct()).toArray()).to.deep.equal(['well', 'educated']);
        // Sadly we cannot do this one correctly
        expect(lineToWords('CURLcode').filter(distinct()).toArray()).to.deep.equal(['cur', 'lcode']);
        expect(lineToWords('kDNSServiceErr_BadSig').filter(distinct()).toArray()).to.deep.equal([
            'k',
            'dns',
            'service',
            'err',
            'bad',
            'sig',
        ]);
        expect(lineToWords('apd_get_active_symbols').filter(distinct()).toArray()).to.deep.equal([
            'apd',
            'get',
            'active',
            'symbols',
        ]);
    });

    it('test reading and normalizing a file', () => {
        const sourceName = path.join(__dirname, '..', '..', 'Samples', 'cities.txt');
        const destName = path.join(__dirname, '..', '..', 'temp', 'cities.txt');
        return compileWordList(sourceName, destName, { splitWords: true, sort: true })
        .then(() => fsp.readFile(destName, 'utf8'))
        .then(output => {
            expect(output).to.be.equal(citiesResultSorted);
        });
    });

    it('test compiling to a file without split', () => {
        const sourceName = path.join(__dirname, '..', '..', 'Samples', 'cities.txt');
        const destName = path.join(__dirname, '..', '..', 'temp', 'cities2.txt');
        return compileWordList(sourceName, destName, { splitWords: false, sort: true })
        .then(() => fsp.readFile(destName, 'utf8'))
        .then(output => {
            expect(output).to.be.equal(citiesSorted.toLowerCase());
        });
    });

    it('tests normalized to a trie', () => {
        const words = citiesResult.split('\n');
        const nWords = normalizeWords(genSequence(words)).toArray();
        const tWords = [...genSequence([normalizeWordsToTrie(genSequence(words))])
            .concatMap(node => Trie.iteratorTrieWords(node))];
        expect(tWords.sort()).to.be.deep.equal([...(new Set(nWords.sort()))]);
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

function distinct(): (word: string) => boolean {
    const known = new Set<String>();
    return a => known.has(a) ? false : (known.add(a), true);
}

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

const citiesSorted = `\
London
Los Angeles
Mexico City
New Amsterdam
New Delhi
New York
Paris
San Francisco
`;

const citiesResult = `\
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

const citiesResultSorted = `\
amsterdam
angeles
city
delhi
francisco
london
los
los angeles
mexico
mexico city
new
new amsterdam
new delhi
new york
paris
san
san francisco
york
`;
