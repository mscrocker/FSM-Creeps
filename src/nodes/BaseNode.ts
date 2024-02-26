import { BaseInputType } from "./InputTypes.js";
import { NodeAbortReason } from "./NodeAbortReason.js";
import { NodeContext } from "./NodeContext.js";
import { BasePayloadType } from "./PayloadTypes.js";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType, ExtractSlotKeyTypeFromSlot } from './SlotTypes.js';
import { EmptySlotType, WithArgumentsSlotType } from './SlotTypes';

/**
 * Return type used for the loop of the node functions. This type can either be void, a full slot with its key and arguments or only the slot
 * key for those slots that do not have arguments.
 */
export type NodeLoopReturnType<SlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>> = void | ExtractSlotKeyTypeFromSlot<SlotType> | SlotType;

/**
 * Base class used to implement all kind of nodes. These can be either wrappers, graphs or leaf tasks. It receives 
 * @typeParam SlotType The type containing an union of all the slots that can have a transition attached into this node.
 * @typeParam InputType The dynamic input type specifying the shape that the data coming from a transition can have.
 * @typeParam RequiredPayloadType The type containing an intersection of all the payloads required for the execution of this node.
 * @typeParam MemoryInternalDataType The type of the memory object that will store the agent information for this task between iterations.
 */
export abstract class BaseNode<SlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, InputType extends BaseInputType, RequiredPayloadType extends BasePayloadType, MemoryInternalDataType extends {} = {}> {
        
    // Quick-hack. Since TypeScript implements Duck-typing, it is necessary to store somewhere both the SlotType and RequirePayloadType in order
    // to be able to infer these type parameters. In runtime, thess fields do not exist in the objects.
    _slotTypes?: SlotType;

    //@ts-ignore
    _payload: RequiredPayloadType;

    abstract start(args: InputType, payload: RequiredPayloadType): MemoryInternalDataType;
    
    abstract loop(context: NodeContext<ExtractSlotKeyTypeFromSlot<SlotType>, RequiredPayloadType>, memory: MemoryInternalDataType): NodeLoopReturnType<SlotType>;

    abstract abort(reason: NodeAbortReason, memory: MemoryInternalDataType, payload: RequiredPayloadType): void;

}

/**
 * Base type for the internal state of the leaf task. The purpose of this state is to store constant values at task level that will not be modified
 * between execution steps.
 */
export type BaseInternalConstantStateType = {}

/**
 * Auxiliary type to prevent the modification of the state value.
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>
}


export type LoopReturnTypeFormatter<ReturnType, WithArgumentsSlotKeyType extends BaseSlotKeyType> = 
    ReturnType extends BaseSlotKeyType ? 
        ReturnType : 
        (ReturnType extends WithArgumentsSlotType<WithArgumentsSlotKeyType, infer SlotArgsType> ? 
            WithArgumentsSlotType<WithArgumentsSlotKeyType, SlotArgsType> : 
            void);

export type ComputeSlotTypeFromLoopReturnType<T> = T extends BaseSlotKeyType ? EmptySlotType<T> : (T extends WithArgumentsSlotType<infer SlotKeyType, infer SlotArgsType> ? WithArgumentsSlotType<SlotKeyType, SlotArgsType> : never);

type BaseClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType> = {context: NodeContext<BaseSlotKeyType, PayloadType>, memory: MemoryType, constantState: DeepReadonly<InternalConstantStateType>}
type FilteredClassPayloadType<PayloadType, MemoryType, InternalConstantStateType> = Omit<PayloadType, keyof BaseClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType>>
export type ClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType> = BaseClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType> & FilteredClassPayloadType<PayloadType, MemoryType, InternalConstantStateType>

/**
 * Helper type used for the creation of a new leaf node from an object.
 */
export type LeafTaskClassCreationArguments
    <LoopReturnType, WithArgumentsSlotKeyType extends BaseSlotKeyType, MemoryType extends any, StartArgsType extends BaseInputType,
    InternalConstantStateType extends BaseInternalConstantStateType, PayloadType extends BasePayloadType, CreateArgsType extends unknown[]> = {

    create?: (...args: CreateArgsType) => InternalConstantStateType;

    start?: (args: StartArgsType, constantState: InternalConstantStateType, payload: PayloadType) => MemoryType;

    loop: 
        //(args: {payload: Readonly<PayloadType>, context: NodeContext<BaseSlotKeyType, PayloadType>, memory: MemoryType, constantState: DeepReadonly<InternalConstantStateType>}) => 
        (args: ClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType>) => 
        LoopReturnTypeFormatter<LoopReturnType, WithArgumentsSlotKeyType>;

    abort?: (reason: NodeAbortReason, memory: MemoryType, payload: PayloadType) => void;

}

type BaseFunctionalLoopArgs<PayloadType, MemoryType> = {context: NodeContext<BaseSlotKeyType, PayloadType>, memory: MemoryType}
type FilteredFunctionalPayloadType<PayloadType, MemoryType> = Omit<PayloadType, keyof BaseFunctionalLoopArgs<PayloadType, MemoryType>>
export type FunctionalLoopArgs<PayloadType, MemoryType> = BaseFunctionalLoopArgs<PayloadType, MemoryType> & FilteredFunctionalPayloadType<PayloadType, MemoryType>


/**
 * Helper type used for the creation of a new leaf node from a function.
 */
export type LeafTaskFunctionalCreationArguments<LoopReturnType, WithArgumentsSlotKeyType extends BaseSlotKeyType, MemoryType extends any, PayloadType extends BasePayloadType> = 
    //(args: {payload: PayloadType, context: NodeContext<BaseSlotKeyType, PayloadType>, memory: MemoryType}) => LoopReturnTypeFormatter<LoopReturnType, WithArgumentsSlotKeyType>;
    (args: FunctionalLoopArgs<PayloadType, MemoryType>) => LoopReturnTypeFormatter<LoopReturnType, WithArgumentsSlotKeyType>;

/**
 * Function that receives an object whose type will be used to infer the payload type. As a result, it returns a function that is able to construct
 * a new leaf class, inferring the types from its parameters.
 * @template PayloadType The payload type that will be inferred and provided to the leaf nodes that will be created with the resulting generator function
 * @param _leafTaskBuilderArgs The object whose type will be used to infer the payload type of the leaf node. The value will be discarded
 * @returns The builder function that can generate leaf nodes
 */
export function createLeafTaskBuilder<PayloadType extends BasePayloadType>(_leafTaskBuilderArgs: PayloadType):

        <LoopReturnType, WithArgumentsSlotKeyType extends BaseSlotKeyType, 
        MemoryType extends {}, StartArgsType extends BaseInputType, InternalStateType extends BaseInternalConstantStateType, CreateArgsType extends unknown[]>
            (leafTaskArgs: LeafTaskClassCreationArguments<LoopReturnType, WithArgumentsSlotKeyType, MemoryType, StartArgsType, InternalStateType, PayloadType, CreateArgsType> |
                LeafTaskFunctionalCreationArguments<LoopReturnType, WithArgumentsSlotKeyType, MemoryType, PayloadType>) => (new (...args: CreateArgsType) => BaseNode<ComputeSlotTypeFromLoopReturnType<LoopReturnType>, StartArgsType, PayloadType, MemoryType>) {
            
            
            return (<LoopReturnType, WithArgumentsSlotKeyType extends BaseSlotKeyType, MemoryType extends {},
                StartArgsType extends BaseInputType, InternalConstantStateType extends BaseInternalConstantStateType, CreateArgsType extends unknown[]>
                    (leafTaskArgs: LeafTaskClassCreationArguments<LoopReturnType, WithArgumentsSlotKeyType, MemoryType, StartArgsType, InternalConstantStateType, PayloadType, CreateArgsType> |
                    LeafTaskFunctionalCreationArguments<LoopReturnType, WithArgumentsSlotKeyType, MemoryType, PayloadType>) => { 
                
                
                if (!("loop" in leafTaskArgs)){
                    let leafArgs = leafTaskArgs;
                    class BasicFunctionalLeafNode extends BaseNode<ComputeSlotTypeFromLoopReturnType<LoopReturnType>, StartArgsType, PayloadType, MemoryType> {

                        start(_args: StartArgsType, _payload: PayloadType): MemoryType {
                            return {} as MemoryType
                        }
    
                        loop(context: NodeContext<BaseSlotKeyType, PayloadType>, memory: MemoryType) {
                            return leafArgs({
                                ...context.getPayload(),
                                context,
                                memory
                            }) as any
                        }
    
                        abort(_reason: NodeAbortReason, _memory: MemoryType): void {
                            return
                        }
    
                    }
                    return BasicFunctionalLeafNode
                } else {
                    let leafArgs = leafTaskArgs;
                    class BasicClassLeafNode extends BaseNode<ComputeSlotTypeFromLoopReturnType<LoopReturnType>, StartArgsType, PayloadType, MemoryType> {
                        
                        private constantState: InternalConstantStateType

                        start(args: StartArgsType, payload: PayloadType): MemoryType {
                            if (leafArgs.start){
                                return leafArgs.start(args, this.constantState, payload)
                            }
                            return {} as MemoryType
                        }
    
                        loop(context: NodeContext<BaseSlotKeyType, PayloadType>, memory: MemoryType) {
                            return leafArgs.loop({
                                ...context.getPayload(),
                                context,
                                memory,
                                constantState: this.constantState
                            }) as any
                        }
    
                        abort(reason: NodeAbortReason, memory: MemoryType, payload: PayloadType): void {
                            if (leafArgs.abort){
                                return leafArgs.abort(reason, memory, payload)
                            }
                        }

                        constructor(...args: CreateArgsType){
                            super();
                            if (leafArgs.create){
                                this.constantState = leafArgs.create(...args)
                            } else {
                                this.constantState = {} as InternalConstantStateType
                            }
                        }
                    }
                    return BasicClassLeafNode
                }
            });
}