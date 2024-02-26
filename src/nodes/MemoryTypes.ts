import { BaseNode } from "./BaseNode.js";
import { BaseInputType } from "./InputTypes.js";
import { BaseSlotType, BaseSlotKeyType, BaseSlotArgsType } from "./SlotTypes.js";

/**
 * Auxiliary type to infer the memory type out of a given node type.
 */
export type ExtractMemoryType<NodeType extends BaseNode<BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, BaseInputType, any>> = NodeType extends BaseNode<any, any, infer MemoryType> ? MemoryType : {};