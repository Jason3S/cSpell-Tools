/**
 * Generates a distinct filter function that will remember up to 2 * maxSize entries.
 * This method uses a sliding window of 2 Sets: the primary set and the secondary set.
 * The primary set will contain the most recently seen entries and the secondary set
 * contains entries from the past.
 *
 * When the primary set becomes full it becomes the secondary set a new primary set
 * is created freeing up the memory used by the old secondary set. This prevents
 * recently seen duplicates from being considered distinct while attempting to keep
 * memory usage to under 2 * maxSize.
 *
 * @param maxSize max size of each Set
 */
export function distinct<T>(maxSize: number) {
    const memory = [
        new Set<T>(),
        new Set<T>()
    ];
    const limit = maxSize;
    let p = 0;
    let s = 1;

    return (w: T) => {
        if (memory[p].has(w)) return false;

        const found = memory[s].has(w);
        if (memory[p].size === limit) {
            [p, s] = [s, p];
            memory[p].clear();
        }
        memory[p].add(w);
        return !found;
    };
}
