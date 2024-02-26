

/**
 * Interface defining the type of a call stack frame for the graph execution.
 */
export interface GraphStackFrame {
    /**
     * The name of the graph.
     */
    graphName: string;

    /**
     * The name of the node executed in the graph.
     */
    nodeName: string;

    /**
     * The slots that the node being executed has registered.
     */
    registeredSlots: string[];

}