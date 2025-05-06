import { FSFlagStatus } from '../enum/FSFlagStatus.ts';
import { IFSFlagMetadata } from '../types.ts';

/**
 * This class represents a flag in the `Flagship SDK`. It helps you retrieve the flag value, access flag metadata,
 * expose the flag, verify the flag's existence, and get the flag status
 * @template T The type of the flag value.
 */
export interface IFSFlag {
    /**
     * Returns the value of the flag.
     * If the flag exists and the type of the default value matches the flag type value.
     * It can expose the flag if needed.
     * @param visitorExposed Specifies whether to report the flag exposure. Default is true.
     * @returns The value of the flag.
     */
    getValue<T>(defaultValue: T, visitorExposed?: boolean): (T extends null ? unknown : T);

    /**
     * Checks if the flag exists.
     * @returns True if the flag exists, false otherwise.
     */
    exists: () => boolean;

    /**
     * Notifies Flagship that the visitor has been exposed to and seen this flag.
     * @returns A promise that resolves when the notification is complete.
     */
    visitorExposed: () => Promise<void>;

    /**
     * Returns the metadata of the flag.
     */
    readonly metadata: IFSFlagMetadata;

    /**
     * Returns the status of the flag.
     */
    readonly status: FSFlagStatus;
  }
