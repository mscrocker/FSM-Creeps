
/**
 * Base type for the keys of the slot.
 */
export type BaseSlotKeyType = string;

/**
 * Base type for the args of a slot.
 */
export type BaseSlotArgsType = any;

/**
 * Base type for the slots without arguments.
 */
export type EmptySlotType<SlotKeyType extends BaseSlotKeyType> = {
    key: SlotKeyType;
};

/**
 * Base type for the slots with arguments.
 */
export type WithArgumentsSlotType<SlotKeyType extends BaseSlotKeyType, SlotArgsType extends BaseSlotArgsType> = {
    args: SlotArgsType;
} & EmptySlotType<SlotKeyType>;

/**
 * Base type for all the slots.
 */
export type BaseSlotType<SlotKeyType extends BaseSlotKeyType, SlotArgsType extends BaseSlotArgsType = void> = void extends SlotArgsType ? EmptySlotType<SlotKeyType> : WithArgumentsSlotType<SlotKeyType, SlotArgsType>;


/**
 * Auxiliary type able to infer the key type of a given slot type.
 */
export type ExtractSlotKeyTypeFromSlot<SlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>> = SlotType extends { key: infer KeyInferredType; args?: infer ArgsInferredType } ? KeyInferredType : BaseSlotKeyType;

/**
 * Auxiliary type able to infer the slot type of a given node type.
 */
export type ExtractSlotType<NodeType> = NodeType extends { _slotTypes?: infer SlotType } ? SlotType : never;

/**
 * Auxiliary type able to infer the key type of a given slot type, provided that this slot type has no arguments. If the slot type is made up of a union of multiple
 * slot types, then the slots with arguments will be filtered out.
 */
export type GetSlotKeysOfEmptySlotTypes<T> = T extends BaseSlotType<infer SlotKeyType, infer SlotArgsType> ? ( void extends SlotArgsType ? SlotKeyType: never) : never;

/**
 * Auxiliary function able to provided type information of the arguments of a given slot, without really providing a value for these arguments. It can be used as sugar syntax to manually specifying the type arguments of a
 * function or class that expects the user to provide a value for the slot arguments.
 * @returns No value.
 */
export function SlotArgumentsWithEmptyDefault<TransitionArgumentsType>(){return undefined as unknown as TransitionArgumentsType;}