import { expect } from 'chai';
import { distinct } from './distinct';

const samples = [
    { m: 2, s: [], e: [] },
    { m: 2, s: [1, 1, 2, 1, 2, 3, 1, 4, 5, 2, 1], e: [1, 2, 3, 4, 5, 2, 1] },
    { m: 3, s: [1, 1, 2, 1, 2, 3, 1, 4, 5, 2], e: [1, 2, 3, 4, 5] },
    { m: 3, s: [1, 1, 2, 1, 2, 3, 1, 4, 5, 2, 1, 6, 3, 1], e: [1, 2, 3, 4, 5, 6, 3] },
];

describe('Validate Distinct', () => {
    samples.forEach(s => {
        it('test distinct', () => {
            expect(s.s.filter(distinct(s.m))).to.be.deep.equal(s.e);
        });
    });
});

