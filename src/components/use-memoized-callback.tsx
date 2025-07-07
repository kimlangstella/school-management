"use client";

import * as React from "react";

/**
 * A generic, typed hook to memoize a callback that always calls
 * the *latest* version of `fn`.
 *
 * The hook’s stable function never changes identity, yet it forwards
 * calls to the most recent `fn`.
 *
 * @param fn The function that you want to keep updated but with stable identity.
 *
 * @returns A memoized function that always calls the latest `fn`.
 */
export function useMemoizedCallback<Args extends unknown[], Return>(
    fn: (...args: Args) => Return
): (...args: Args) => Return {
    // We store the updated fn in a ref whenever it changes.
    const fnRef = React.useRef(fn);

    React.useEffect(() => {
        fnRef.current = fn;
    }, [fn]);

    // We store the stable function in a ref so it never changes identity.
    const stableFnRef = React.useRef<(...args: Args) => Return>(null);

    // If there's no stable function yet, create one.
    if (!stableFnRef.current) {
        stableFnRef.current = (...args: Args) => {
            // Calls the latest version of `fn`.
            return fnRef.current(...args);
        };
    }

    return stableFnRef.current;
}