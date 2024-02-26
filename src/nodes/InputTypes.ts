import { BaseNode } from "./BaseNode.js";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType } from "./SlotTypes.js";

/**
 * Base type for the dynamic input of the nodes.
 */
export type BaseInputType = any;

/**
 * Auxiliary type used to infer the node input type out a given node type.
 */
export type ExtractNodeInputType<NodeType extends BaseNode<BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, BaseInputType, any>> = NodeType extends { start: (args: infer R) => void } ? R : BaseInputType;
