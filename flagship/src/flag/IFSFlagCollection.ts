import { IFSFlagMetadata, SerializedFlagMetadata } from '../types';
import { IFSFlag } from './IFSFlag';

/**
 * Represents a collection of flags.
 */
export interface IFSFlagCollection extends Iterable<[string, IFSFlag]> {
    /**
     * Gets the number of flags in the collection.
     */
    readonly size: number;

    /**
     * Retrieves the flag associated with the specified key.
     * @param key - The key of the flag to retrieve.
     * @returns The flag associated with the specified key, or an empty if the key is not found.
     */
    get(key: string): IFSFlag;

    /**
     * Checks if the collection contains a flag with the specified key.
     * @param key - The key to check.
     * @returns True if the collection contains a flag with the specified key, false otherwise.
     */
    has(key: string): boolean;

    /**
     * Gets the keys of all flags in the collection.
     * @returns A set of all keys in the collection.
     */
    keys(): Set<string>;

    /**
     * Returns an iterator for the collection.
     * @returns An iterator for the collection.
     */
    [Symbol.iterator](): Iterator<[string, IFSFlag]>;

    /**
     * Filters the collection based on a predicate function.
     * @param predicate - The predicate function used to filter the collection.
     * @returns A new IFSFlagCollection containing the flags that satisfy the predicate.
     */
    filter(predicate: (value: IFSFlag, key: string, collection: IFSFlagCollection) => boolean): IFSFlagCollection;

    /**
     * Exposes all flags in the collection.
     * @returns A promise that resolves when all flags have been exposed.
     */
    exposeAll(): Promise<void>;

    /**
     * Retrieves the metadata for all flags in the collection.
     * @returns A map containing the metadata for all flags in the collection.
     */
    getMetadata(): Map<string, IFSFlagMetadata>;

    /**
     * Serializes the metadata for all flags in the collection.
     * @returns An array of serialized flag metadata.
     */
    toJSON(): SerializedFlagMetadata[];

    /**
     * Iterates over each flag in the collection.
     * @param callbackfn - The function to execute for each flag.
     */
    forEach (callbackfn: (value: IFSFlag, key: string, collection: IFSFlagCollection) => void): void
}
