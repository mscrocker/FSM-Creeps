import { BaseSlotKeyType } from "../../nodes/SlotTypes.js";

/**
 * Base type for the transition functions.
 */
export type BaseTransitionFunction = (args: any) => any;

/**
 * Base type for all the transitions.
 * @typeParam KeyType The key of the transition.
 * @typeParam SourceNodeKeyType The key of the source node.
 * @typeParam SourceSlotKeyType The source slot key of the transition.
 * @typeParam DestKeyType The key of the destination node.
 * @typeParam FunType The type of the transition function.
 */
export type BaseTransition<KeyType extends string, SourceNodeKeyType extends string, SourceSlotKeyType extends BaseSlotKeyType, DestKeyType extends string, FunType extends BaseTransitionFunction | undefined = undefined> = {
    
    /**
     * Whether a type is internal or external.
     */
    transitionType: "INTERNAL" | "EXTERNAL";

    /**
     * The key of the transition.
     */
    key: KeyType;

    /**
     * The source node of the transition.
     */
    sourceNode: SourceNodeKeyType;

    /**
     * The source slot of the transition.
     */
    sourceSlot: SourceSlotKeyType;

    /**
     * The destination node of the transition.
     */
    dest: DestKeyType;

    /**
     * The function of the transition.
     */
    fun?: FunType;

}

/**
 * Type representing internal transitions.
 * @typeParam KeyType The key of the transition.
 * @typeParam SourceNodeKeyType The key of the source node.
 * @typeParam SourceSlotKeyType The source slot key of the transition.
 * @typeParam DestNodeKeyType The key of the destination node.
 * @typeParam FunType The type of the transition function.
 */
export type InternalTransition
    <KeyType extends string, SourceNodeKeyType extends string, SourceSlotKeyType extends BaseSlotKeyType,
     DestNodeKeyType extends string, FunType extends BaseTransitionFunction = (args: any) => void>  = 
     
     BaseTransition<KeyType, SourceNodeKeyType, SourceSlotKeyType, DestNodeKeyType, FunType> & {
        transitionType: "INTERNAL";
     };

/**
 * Type representing external transitions.
 * @typeParam KeyType The key of the transition.
 * @typeParam SourceNodeKeyType The key of the source node.
 * @typeParam SourceSlotKeyType The source slot key of the transition.
 * @typeParam DestSlotKeyType The key of the destination node.
 * @typeParam FunType The type of the transition function.
 */
export type ExternalTransition
    <KeyType extends string, SourceNodeKeyType extends string, SourceSlotKeyType extends BaseSlotKeyType, 
     DestSlotKeyType extends string, FunType extends BaseTransitionFunction> = 
     
     BaseTransition<KeyType, SourceNodeKeyType, SourceSlotKeyType, DestSlotKeyType, FunType> & {
        transitionType: "EXTERNAL";
    };