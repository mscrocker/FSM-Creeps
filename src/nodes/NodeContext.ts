import { GraphStackFrame } from "./graph/GraphStackFrame.js";
import { BaseSlotKeyType } from "./SlotTypes.js";

/**
 * Base interface for all the contexts provided by the graphs to the nodes.
 */
export interface NodeContext<SlotKey extends BaseSlotKeyType, PayloadType> {

    /**
     * Checks whether a given slot has a transition registered for it in the container graph.
     * @param slotName The name of the slot to check.
     * @returns Whether it is registered.
     */
    slotIsEnabled(slotName: SlotKey): boolean;

    /**
     * Gets the call stack of the graphs and subgraphs that led to the execution of the current task.
     * @returns The call stack.
     */
    getStack(): Readonly<GraphStackFrame[]>;

    /**
     * Gets the available payload for the task.
     * @returns The payload.
     */
    getPayload(): Readonly<PayloadType>;

    /**
     * When called before firing a transition, it allows the new task to start the execution in this
     * iteration.
     */
    allowImmediateTransition(): void;

}

/**
 * Default implementation for the NodeContext interface.
 */
export class NodeContextImpl<SlotKey extends string, PayloadType> implements NodeContext<SlotKey, PayloadType> {

    private allowedImmediateTransition: boolean = false;


    public slotIsEnabled(slotName: SlotKey): boolean {
        return this.stack[this.stack.length - 1].registeredSlots.includes(slotName);
    }

    getStack(): Readonly<GraphStackFrame[]> {
        return this.stack;
    }

    getPayload(): Readonly<PayloadType> {
        return this.payload;
    }

    isAllowedImmediateTransition(): boolean {
        return this.allowedImmediateTransition;
    }

    /**
     * Creates a new context from this context with an additional stack frame included in the execution stack.
     * @param stackFrame The new stack frame.
     * @returns The new NodeContext object.
     */
    public pushStackFrame(stackFrame: GraphStackFrame): NodeContextImpl<SlotKey, PayloadType> {

        const newContext = new NodeContextImpl<SlotKey, PayloadType>(this.payload, this.stack);
        newContext.stack.push(stackFrame);
        return newContext;

    }

    /**
     * Constructor of the NodeContextImpl class.
     * @param payload The payload object for the node context.
     * @param stack The initial call stack of the node context.
     */
    constructor(private payload: PayloadType, private stack: GraphStackFrame[]){

    }

    allowImmediateTransition(): void {
        this.allowedImmediateTransition = true;
    }


}