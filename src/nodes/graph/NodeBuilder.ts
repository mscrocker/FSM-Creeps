import { BaseNode } from "../BaseNode";
import { BaseTransitionFunction, InternalTransition } from "./TransitionTypes";
import { InternalTransitionDestinationNodeType, InternalTransitionFunctionType, NodeKeyArgumentType, SlotKeyWithoutDuplicated, TransitionSourceNodeType, TransitionSourceSlotType } from "../GraphValidationTypes";
import { ExtractNodeInputType } from "../InputTypes";
import { NodeContainer } from "../NodeContainer";
import { BasePayloadType, CombinePayloadType, ExtractNodePayloadType } from "../PayloadTypes";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType } from "../SlotTypes";
import { TransitionBuilder, updateTransitionsBuilder } from "./TransitionBuilder.js";
import { AnyNode } from "../../nodes/AnyNode.js";


export type NodeBuilder_addNode_Type<ValidNodesType extends NodeContainer<string, AnyNode>, ValidSlotsType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, RequiredPayloadType extends BasePayloadType> = 
    <NewKeyType extends string, NodeType extends BaseNode<BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, ExtractNodeInputType<NodeType>, any>>
    (key: NodeKeyArgumentType<NewKeyType, ValidNodesType>, nodeInstance: NodeType, defaultInput?: ExtractNodeInputType<NodeType>) => 
        NodeBuilder<NodeContainer<NewKeyType, NodeType> | ValidNodesType, ValidSlotsType, CombinePayloadType<RequiredPayloadType,ExtractNodePayloadType<NodeType>>>;

export type NodeBuilder_addTransition_Type<ValidNodesType extends NodeContainer<string, AnyNode>, ValidSlotsType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, RequiredPayloadType extends BasePayloadType> = <NewTransitionKey extends string, SourceNodeKeyType extends string, 
    SourceNodeSlotKeyType extends BaseSlotKeyType, DestinationNodeKeyType extends string, NewFunType extends BaseTransitionFunction>

    (transitionKey: NewTransitionKey, 
        sourceNode: TransitionSourceNodeType<SourceNodeKeyType, ValidNodesType>, 
        sourceSlot: TransitionSourceSlotType<SourceNodeKeyType, SourceNodeSlotKeyType, ValidNodesType, never, never>,
        dest: InternalTransitionDestinationNodeType<DestinationNodeKeyType, ValidNodesType>,
        fun?: InternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, NewFunType, ValidNodesType>) => 
    TransitionBuilder<ValidNodesType, ValidSlotsType, InternalTransition<NewTransitionKey, SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, NewFunType>, never, RequiredPayloadType>;

export type NodeBuilder_addSlot_Type<ValidNodesType extends NodeContainer<string, AnyNode>, ValidSlotsType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, RequiredPayloadType extends BasePayloadType> =
    <NewSlotKey extends string, NewSlotArgumentsType = void>(key: SlotKeyWithoutDuplicated<NewSlotKey, ValidSlotsType>, args?: NewSlotArgumentsType) => 
        NodeBuilder<ValidNodesType, BaseSlotType<NewSlotKey, NewSlotArgumentsType> | ValidSlotsType, RequiredPayloadType>;

export type NodeBuilder<ValidNodesType extends NodeContainer<string, AnyNode>, ValidSlotsType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, RequiredPayloadType extends BasePayloadType>  = {

    addNode: NodeBuilder_addNode_Type<ValidNodesType, ValidSlotsType, RequiredPayloadType>;

    nodes: ValidNodesType[];

    slots: ValidSlotsType[];

    addInternalTransition: NodeBuilder_addTransition_Type<ValidNodesType, ValidSlotsType, RequiredPayloadType>;

    addSlot: NodeBuilder_addSlot_Type<ValidNodesType, ValidSlotsType, RequiredPayloadType>;

}

export type InitialNodeBuilder = NodeBuilder<never, never, BasePayloadType>;


export function updateNodesBuilder<ValidNodesType extends NodeContainer<string, AnyNode>, ValidSlotsType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, RequiredPayloadType extends BasePayloadType>
    (nodes: any[], slots: any): NodeBuilder<ValidNodesType, ValidSlotsType, RequiredPayloadType> {

    return {

        addNode: <NewKeyType extends string, NodeType extends BaseNode<BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, any, any>>
            (key: NodeKeyArgumentType<NewKeyType, ValidNodesType> , nodeInstance: NodeType, defaultInput?: ExtractNodeInputType<NodeType>) => {
                
            return updateNodesBuilder<NodeContainer<NewKeyType, NodeType> | ValidNodesType, ValidSlotsType, CombinePayloadType<RequiredPayloadType, ExtractNodePayloadType<NodeType>>>([{key, nodeInstance, defaultInput}, ...nodes], slots)
        },

        nodes,

        slots,

        addSlot: <NewSlotKey extends string, NewSlotArgumentsType = void>
            (key: SlotKeyWithoutDuplicated<NewSlotKey, ValidSlotsType>, args?: NewSlotArgumentsType) => {

            slots[key] = args ?? undefined;

            return updateNodesBuilder<ValidNodesType, BaseSlotType<NewSlotKey, NewSlotArgumentsType> | ValidSlotsType, RequiredPayloadType>(nodes, slots);
        },

        addInternalTransition: 
            <NewTransitionKey extends string, SourceNodeKeyType extends string, SourceNodeSlotKeyType extends BaseSlotKeyType, 
            DestinationNodeKeyType extends string, NewFunType extends BaseTransitionFunction>

            (transitionKey: NewTransitionKey, 
                sourceNode: TransitionSourceNodeType<SourceNodeKeyType, ValidNodesType>, 
                sourceSlot: TransitionSourceSlotType<SourceNodeKeyType, SourceNodeSlotKeyType, ValidNodesType, never, never>, 
                dest: InternalTransitionDestinationNodeType<DestinationNodeKeyType, ValidNodesType>,
                fun?: InternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, NewFunType, ValidNodesType>) => {
            
            return updateTransitionsBuilder
                <ValidNodesType, ValidSlotsType, InternalTransition<NewTransitionKey, SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, NewFunType>, never, RequiredPayloadType>
                (nodes, slots, [{key: transitionKey, sourceNode: sourceNode as SourceNodeKeyType, sourceSlot: sourceSlot as SourceNodeSlotKeyType,
                     dest: dest as DestinationNodeKeyType, fun: fun as NewFunType, transitionType: "INTERNAL"}], [] as never[]);
        },

    }
}