/**
 * Picks specific keys from an object and returns a new object containing only those keys.
 *
 * @template T - The type of the input object.
 * @template K - The keys to pick from the object.
 * @param {T} obj - The source object to pick keys from.
 * @param {K[]} keys - An array of keys to pick from the object.
 * @returns {Pick<T, K>} A new object containing only the specified keys.
 */
export default function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    return keys.reduce((result, key) => {
        if (key in obj) {
            result[key] = obj[key];
        }
        return result;
    }, {} as Pick<T, K>);
};
