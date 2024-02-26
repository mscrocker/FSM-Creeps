
/**
 * Reasons why a node might get its execution aborted.
 */
export type NodeAbortReason = 
    "AbortedByWrapper" |
    "AbortedByWrapped" |
    "AbortedBySwitch" |
    "AbortedByDeath";