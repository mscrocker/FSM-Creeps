import { BaseNode } from "./BaseNode.js";
import { BaseInputType } from "./InputTypes.js";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType } from "./SlotTypes.js";

/**
 * Base type for the keys of the payload.
 */
export type BasePayloadKeyType = string;

/**
 * Base type for the values of the payload.
 */
export type BasePayloadValueType = {};

/**
 * Base type for the payload.
 */
export type BasePayloadType = {};

/**
 * Auxiliary type that builds a new combined payload as an intersection of two previous payloads. If one of the payload types happened to be
 * the "any" type, then the other payload type would be picked.
 */
export type CombinePayloadType<PayloadTypeA extends BasePayloadType, PayloadTypeB extends BasePayloadType> = 0 extends (1 & PayloadTypeA) ? PayloadTypeB : ( 0 extends (1 & PayloadTypeB) ? PayloadTypeA : (PayloadTypeA & PayloadTypeB));

/**
 * Auxiliary type that is able to infer the payload type of a node type.
 */
export type ExtractNodePayloadType<NodeType extends BaseNode<BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, BaseInputType, any>> = NodeType extends {_payload?: infer PayloadType } ? PayloadType : never;