import { BaseNode, ComputeSlotTypeFromLoopReturnType } from "../../nodes/BaseNode.js";
import { BaseInputType } from "../../nodes/InputTypes.js";
import { NodeAbortReason } from "../../nodes/NodeAbortReason.js";
import { NodeContext } from "../../nodes/NodeContext.js";
import { BasePayloadType } from "../../nodes/PayloadTypes.js";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType, ExtractSlotKeyTypeFromSlot, GetSlotKeysOfEmptySlotTypes } from "../../nodes/SlotTypes.js";
import { WrapperMemoryContainer } from "./WrapperMemory.js";
import { NodeLoopReturnType } from '../BaseNode.js';
import { EmptySlotType } from '../SlotTypes.js';
import { LoopReturnTypeFormatter, DeepReadonly } from '../BaseNode';

/**
 * Helper type to combine the slot types of the wrapper and the node being wrapped. It will make an union of both types, unless one of the types is not
 * explicitly defined in which case the other slot type will be used.
 */
type CombineWrappedAndWrappedSlotTypes<WrapperSlotType extends BaseSlotType<BaseSlotKeyType>, WrappedSlotType extends BaseSlotType<BaseSlotKeyType>> = 
    EmptySlotType<BaseSlotKeyType> extends WrappedSlotType ? WrapperSlotType :  (EmptySlotType<BaseSlotKeyType> extends WrapperSlotType ? WrappedSlotType : (WrappedSlotType | WrapperSlotType));


/**
 * Base class for all the wrappers used in this library.
 * @typeParam WrappedSlotType Slot type for the wrapped node.
 * @typeParam WrappedInputType Input type for the wrapped node.
 * @typeParam WrappedPayloadType Payload type for the wrapped node.
 * @typeParam WrappedMemory Memory type for the wrapped node.
 * @typeParam WrapperSlotType Slot type for the wrapper.
 * @typeParam WrapperInputType Input type for the wrapper.
 * @typeParam WrapperPayloadType Payload type for the wrapper.
 * @typeParam WrapperMemory Memory type for the wrapper.
 */
export abstract class NodeWrapper<
    WrappedSlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>,
    WrappedInputType extends BaseInputType,
    WrappedPayloadType extends BasePayloadType,
    WrappedMemory extends {},
    WrapperSlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>,
    WrapperInputType extends BaseInputType, 
    WrapperPayloadType extends BasePayloadType,
    WrapperMemory extends {}>
    
    
    extends BaseNode<CombineWrappedAndWrappedSlotTypes<WrapperSlotType, WrappedSlotType>, WrapperInputType, WrapperPayloadType & WrappedPayloadType, WrapperMemoryContainer<WrappedMemory, WrapperMemory>> {
    
    // Auxiliary types to help in the inference of the types for validation purposes of the graphs.
    _slotTypes?: CombineWrappedAndWrappedSlotTypes<WrapperSlotType, WrappedSlotType>;
    _wrapperSlots?: WrapperSlotType;
    _wrappedSlots?: WrappedSlotType;
    //@ts-ignore
    _payload: WrapperPayloadType & WrappedPayloadType;
    _wrapperPayload?: WrapperPayloadType;
    _wrappedPayload?: WrappedPayloadType;

    override start(args: WrapperInputType, payload: WrapperPayloadType & WrappedPayloadType): WrapperMemoryContainer<WrappedMemory, WrapperMemory> {
        
        return {
            wrappedMemory: this.wrappedNode.start(this.preprocessDynamicInput(args), payload),
            wrapperMemory: this.wrapperStart(args, payload)
        }


    }

    override loop(context: NodeContext<ExtractSlotKeyTypeFromSlot<WrappedSlotType> | ExtractSlotKeyTypeFromSlot<WrapperSlotType>, WrapperPayloadType & WrappedPayloadType>, memory: WrapperMemoryContainer<WrappedMemory, WrapperMemory>): 
        NodeLoopReturnType<CombineWrappedAndWrappedSlotTypes<WrapperSlotType, WrappedSlotType>> {
        
        const wrapperResult = this.wrapperLoop(context as NodeContext<ExtractSlotKeyTypeFromSlot<WrapperSlotType>, any>, memory.wrapperMemory);

        if (wrapperResult !== undefined){
            
            // Transition fired from wrapper
            this.wrappedNode.abort("AbortedByWrapper", memory.wrappedMemory, context.getPayload());
            return wrapperResult as NodeLoopReturnType<CombineWrappedAndWrappedSlotTypes<WrapperSlotType, WrappedSlotType>>;

        } else {
            const wrappedResult = this.wrappedNode.loop(context as NodeContext<ExtractSlotKeyTypeFromSlot<WrappedSlotType>, any>, memory.wrappedMemory);
            
            if (wrappedResult !== undefined){

                // Transition fired from wrapped
                this.wrapperAbort("AbortedByWrapped", memory.wrapperMemory, context.getPayload());
                return wrappedResult as NodeLoopReturnType<CombineWrappedAndWrappedSlotTypes<WrapperSlotType, WrappedSlotType>>;

            }

        }
    }

    override abort(reason: NodeAbortReason, memory: WrapperMemoryContainer<WrappedMemory, WrapperMemory>, payload: WrapperPayloadType & WrappedPayloadType): void {
        this.wrapperAbort(reason, memory.wrapperMemory, payload);
        this.wrappedNode.abort(reason, memory.wrappedMemory, payload);
    }


    /**
     * The start method for the wrapper.
     * @param args The dynamic input arguments.
     * @returns The initial memory value.
     */
    abstract wrapperStart(args: WrapperInputType, payload: WrapperPayloadType): WrapperMemory;

    /**
     * The loop method for the wrapper.
     * @param context The context of the execution.
     * @param memory The memory value for the wrapper.
     * @returns void or the transition to be fired.
     */
    abstract wrapperLoop(context: NodeContext<ExtractSlotKeyTypeFromSlot<WrapperSlotType>, WrapperPayloadType>,  memory: WrapperMemory): WrapperSlotType | GetSlotKeysOfEmptySlotTypes<WrapperSlotType> | void;

    /**
     * The abort method for the wrapper.
     * @param reason The reason of the abortion.
     * @param memory The memory of the wrapper.
     */
    abstract wrapperAbort(reason: NodeAbortReason, memory: WrapperMemory, payload: WrapperPayloadType): void;

    /**
     * This function should preprocess the dynamic input of the wrapper before dispatching it into the wrapped node.
     * @param args The dynamic input of the wrapper.
     * @returns The dynamic input for the wrapped node.
     */
    abstract preprocessDynamicInput(args: WrapperInputType): WrappedInputType;

    /**
     * Wrapped node of node wrapper.
     */
    private readonly wrappedNode: BaseNode<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory>;
    
    //@ts-ignore
    _wrappedNodeTypeContainer: BaseNode<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory>; // used only for type inference


    /**
     * Constructor for the wrapper class.
     * @param wrappedNode The node being wrapped by this wrapper.
     */
    protected constructor(wrappedNode: BaseNode<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory>){

        super();

        this.wrappedNode = wrappedNode;
    }
}

/**
 * Helper type that matches all the wrappers defined through this library.
 */
export type AnyWrapper = NodeWrapper<BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, BaseInputType, BasePayloadType, {}, BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, BaseInputType, BasePayloadType, {}>;

/**
 * Helper type to infer the type of the BaseNode being extended by a given wrapper type.
 */
export type CastWrapperToBaseNode<Wrapper extends AnyWrapper> =
    Wrapper extends BaseNode<infer SlotType, infer InputType, infer PayloadType, infer MemoryType> ? BaseNode<SlotType, InputType, PayloadType, MemoryType> : never;

/**
 * Helper type to infer the slot type of a given wrapper type.
 */
export type GetSlotType<Wrapper> = Wrapper extends BaseNode<infer SlotType, BaseInputType, BasePayloadType, {}> ? SlotType : never;


type BaseFunctionalLoopArgs<PayloadType, MemoryType> = {context: NodeContext<BaseSlotKeyType, PayloadType>, memory: MemoryType}
type FilteredFunctionalPayloadType<PayloadType, MemoryType> = Omit<PayloadType, keyof BaseFunctionalLoopArgs<PayloadType, MemoryType>>
export type FunctionalLoopArgs<PayloadType, MemoryType> = BaseFunctionalLoopArgs<PayloadType, MemoryType> & FilteredFunctionalPayloadType<PayloadType, MemoryType>

export type FunctionalWrapperCreationArguments<ReturnType, WithArgumentsSlotType extends BaseSlotKeyType, MemoryType extends {}, PayloadType extends BasePayloadType> = 
    //(args: {context: NodeContext<BaseSlotKeyType, BasePayloadType>, memory: MemoryType}) => 
    (args: FunctionalLoopArgs<PayloadType, MemoryType>) => 
    LoopReturnTypeFormatter<ReturnType, WithArgumentsSlotType>;


type BaseClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType> = {context: NodeContext<BaseSlotKeyType, PayloadType>, memory: MemoryType, constantState: DeepReadonly<InternalConstantStateType>}
type FilteredClassPayloadType<PayloadType, MemoryType, InternalConstantStateType> = Omit<PayloadType, keyof BaseClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType>>
export type ClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType> = BaseClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType> & FilteredClassPayloadType<PayloadType, MemoryType, InternalConstantStateType>

export type ClassWrapperCreationArguments
    <ReturnType, WithArgumentsSlotType extends BaseSlotKeyType, MemoryType extends {}, InternalConstantStateType extends {}, CreateArgsType extends unknown[], StartArgsType extends BaseInputType, PayloadType extends BasePayloadType> = {

    create?: (...args: CreateArgsType) => InternalConstantStateType;

    start?: (args: StartArgsType, constantState: InternalConstantStateType, payload: PayloadType) => MemoryType;

    loop: 
        //(args: {context: NodeContext<BaseSlotKeyType, BasePayloadType>, memory: MemoryType, constantState: DeepReadonly<InternalConstantStateType>}) => 
        (args: ClassLoopArgs<PayloadType, MemoryType, InternalConstantStateType>) => 
        LoopReturnTypeFormatter<ReturnType, WithArgumentsSlotType>

    abort?: (reason: NodeAbortReason, memory: MemoryType, payload: PayloadType) => void;

}


export type NodeArgument<NodeSlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, NodeInputType extends BaseInputType,
    WrappedPayloadType extends BasePayloadType, WrappedMemory extends {}, ExternalInputType extends BaseInputType> = {

    node: BaseNode<NodeSlotType, NodeInputType, WrappedPayloadType, WrappedMemory>;
    preprocessInput?: (args: ExternalInputType) => NodeInputType

} | BaseNode<NodeSlotType, NodeInputType, WrappedPayloadType, WrappedMemory>

export function createWrapperBuilder<PayloadType>(_payload: PayloadType): 
    
    <ReturnType, WithArgumentsSlotType extends BaseSlotKeyType, MemoryType extends {}, InternalConstantStateType extends {}, StartArgsType extends BaseInputType, CreateArgsType extends unknown[] = []>
    (args: FunctionalWrapperCreationArguments<ReturnType, WithArgumentsSlotType, MemoryType, PayloadType> | 
        ClassWrapperCreationArguments<ReturnType, WithArgumentsSlotType, MemoryType, InternalConstantStateType, CreateArgsType, StartArgsType, PayloadType>) => 
            new <WrappedSlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, WrappedInputType extends BaseInputType, WrappedPayloadType extends BasePayloadType, WrappedMemory extends {}>
                (node: NodeArgument<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory, StartArgsType>, ...args: CreateArgsType) => 
                    NodeWrapper<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory, ComputeSlotTypeFromLoopReturnType<ReturnType>, StartArgsType, PayloadType, MemoryType>{    
        
        
        return <ReturnType, WithArgumentsSlotType extends BaseSlotKeyType, MemoryType extends {}, InternalConstantStateType extends {}, StartArgsType extends BaseInputType, CreateArgsType extends unknown[] = []>
            (args: FunctionalWrapperCreationArguments<ReturnType, WithArgumentsSlotType, MemoryType, PayloadType> | 
                ClassWrapperCreationArguments<ReturnType, WithArgumentsSlotType, MemoryType, InternalConstantStateType, CreateArgsType, StartArgsType, PayloadType>): 
                    new <WrappedSlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, WrappedInputType extends BaseInputType, WrappedPayloadType extends BasePayloadType, WrappedMemory extends {}>
                        (node: NodeArgument<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory, StartArgsType>, ...createArgs: CreateArgsType) => 
                            NodeWrapper<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory, ComputeSlotTypeFromLoopReturnType<ReturnType>, StartArgsType, PayloadType, MemoryType> => {


                    class AuxWrapper<WrappedSlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, WrappedInputType extends BaseInputType, WrappedPayloadType extends BasePayloadType,
                        WrappedMemory extends {}, StartArgsType> extends NodeWrapper<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory,
                        ComputeSlotTypeFromLoopReturnType<ReturnType>, StartArgsType, PayloadType, MemoryType> {

                        private internalState: InternalConstantStateType;
                        private preprocessInputCallback?: (args: StartArgsType) => WrappedInputType;

                        public constructor(node: NodeArgument<WrappedSlotType, WrappedInputType, WrappedPayloadType, WrappedMemory, StartArgsType>, ...createArgs: CreateArgsType){
                            if ("node" in node){
                                super(node.node)
                                if (node.preprocessInput){
                                    this.preprocessInputCallback = node.preprocessInput
                                }
                            } else {
                                super(node)
                            }
                            if ("create" in args){
                                const casted = args as ClassWrapperCreationArguments<ReturnType, WithArgumentsSlotType, MemoryType, InternalConstantStateType, CreateArgsType, StartArgsType, PayloadType>
                                this.internalState = (casted.create as (...args: CreateArgsType) => InternalConstantStateType)(...createArgs)
                            } else {
                                this.internalState = {} as InternalConstantStateType
                            }
                        }
                        

                        wrapperStart(startArgs: StartArgsType, payload: PayloadType): MemoryType {
                            if ("loop" in args){
                                const casted = args as ClassWrapperCreationArguments<ReturnType, WithArgumentsSlotType, MemoryType, InternalConstantStateType, CreateArgsType, StartArgsType, PayloadType>
                                if (casted.start){
                                    return casted.start(startArgs, this.internalState, payload) ?? {}
                                } else {
                                    return {} as MemoryType
                                }
                            } else {
                                return {} as MemoryType
                            }
                        }

                        wrapperLoop(context: NodeContext<ExtractSlotKeyTypeFromSlot<ComputeSlotTypeFromLoopReturnType<ReturnType>>, PayloadType>, memory: MemoryType): ComputeSlotTypeFromLoopReturnType<ReturnType> | GetSlotKeysOfEmptySlotTypes<ComputeSlotTypeFromLoopReturnType<ReturnType>> | void {
                            if ("loop" in args){
                                return args.loop({ ...context.getPayload(), context, memory, constantState: this.internalState}) as any;
                            } else {
                                return args({ ...context.getPayload(), context, memory}) as any
                            }
                        }
                        wrapperAbort(reason: NodeAbortReason, memory: MemoryType, payload: PayloadType) {
                            if ("abort" in args){
                                return (args.abort as (reason: NodeAbortReason, memory: MemoryType, payload: PayloadType) => void)(reason, memory, payload)
                            }
                        }
                        preprocessDynamicInput(args: StartArgsType): WrappedInputType {
                            if (this.preprocessInputCallback){
                                return this.preprocessInputCallback(args)
                            }
                            return args as WrappedInputType;
                        }
                            
                    }
                    
                    return AuxWrapper
                };
    

}