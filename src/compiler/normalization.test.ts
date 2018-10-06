// cSpell:ignore jpegs outing dirs lcode café APCU
// cSpell:enableCompoundWords

import { expect } from 'chai';
import { lineToWords, removeAccents, extractWordGroups, normalizeEntries } from './normalization';
import { toArray } from 'rxjs/operators';
import { from } from 'rxjs';

const een = 'één';
const eenD = een.normalize('NFD');
const cafe = 'café'.normalize('NFD');

describe('Validate the wordListCompiler', function() {
    it('tests splitting lines', () => {
        const line = 'AppendIterator::getArrayIterator';
        expect(lineToWords(line).filter(distinct())).to.deep.equal([
            'AppendIterator',
            'getArrayIterator',
        ]);
    });

    it('test removing accents from words', () => {
        expect(removeAccents('Hello')).to.equal('Hello');
        expect(removeAccents('Hé')).to.equal('He');
        expect(removeAccents(een)).to.equal('een');
        expect(removeAccents(eenD)).to.equal('een');
        expect(removeAccents('öô')).to.equal('oo');
    });

    it('test extracting word groups from a line of text', () => {
        expect(extractWordGroups(`Happy Birthday! ${cafe} corner`)).to.be.deep.equal(['Happy Birthday', `${cafe} corner`]);
        expect(extractWordGroups(`expect(removeAccents(${eenD})).to.equal('een');`))
        .to.be.deep.equal(['expect', 'removeAccents', eenD, 'to', 'equal', "'een'"]);
        expect(extractWordGroups('APCUIterator::getTotalCount')).to.be.deep.equal(['APCUIterator', 'getTotalCount']);
        expect(extractWordGroups('apc_bin_load')).to.be.deep.equal(['apc_bin_load']);
    });

    it('normalizeEntries', () => {
        return normalizeEntries(from(sampleList), true, true).pipe(toArray()).toPromise().then(a => {
            expect(a).to.be.deep.equal(
                'cafe,Café,~Cafe,^café,~^cafe,APCUIterator,^apcuiterator,rewind,valid,__construct,apcu_add,apcu_cache_info,apcu_cas'.split(',')
            );
        });
    });
});

function distinct(): (word: string) => boolean {
    const known = new Set<String>();
    return a => known.has(a) ? false : (known.add(a), true);
}

const sample = `
cafe
Café
APCUIterator::rewind
APCUIterator::valid
APCUIterator::__construct
apcu_add
apcu_cache_info
apcu_cas
`;

const sampleList = sample.split('\n');
