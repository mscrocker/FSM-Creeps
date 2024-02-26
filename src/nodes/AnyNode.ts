import { BaseNode } from "./BaseNode.js";
import { BaseSlotKeyType, BaseSlotType, BaseSlotArgsType } from './SlotTypes.js';
import { BaseInputType } from './InputTypes.js';
import { BasePayloadType } from './PayloadTypes.js';

/**
 * Helper type that should be extended by all the nodes defined through this library.
 */
export type AnyNode = BaseNode<BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, BaseInputType, BasePayloadType, {}>;