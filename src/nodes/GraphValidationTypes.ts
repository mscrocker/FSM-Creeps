import { BaseNode } from "./BaseNode.js";
import { BaseTransitionFunction, ExternalTransition, InternalTransition } from "./graph/TransitionTypes.js";
import { CastToBaseNodes, NodeContainer } from "./NodeContainer.js";
import { BaseSlotKeyType, BaseSlotType, WithArgumentsSlotType } from './SlotTypes.js';




export type ExtractValidNodeKeys<ValidNodesType> = ValidNodesType extends NodeContainer<infer ValidNodeKeys, BaseNode<BaseSlotType<any, any>, any, any>> ? ValidNodeKeys : never;



export type GetValidSlotKeys<NodeKey extends string, ValidNodesType> =
    ValidNodesType extends NodeContainer<NodeKey, BaseNode<BaseSlotType<infer ValidSlotKeys, any>, any, any>> ? ValidSlotKeys : never;

type GetInternallyUsedSlotKeys<NodeKey extends string, ValidInternalTransitionsType> = 
    ValidInternalTransitionsType extends InternalTransition<any, NodeKey, infer UsedSlotKeys, any, any> ? UsedSlotKeys : never;

type GetExternallyUsedSlotKeys<NodeKey extends string, ValidExternalTransitionsType> = 
    ValidExternalTransitionsType extends ExternalTransition<any, NodeKey, infer UsedSlotKeys, any, any> ? UsedSlotKeys : never;

type GetUnusedSlotKeys<NodeKey extends string, ValidSlotKeys, ValidInternalTransitionsType, ValidExternalTransitionsType> = 
    [ValidInternalTransitionsType] extends [never] ? ValidSlotKeys : 
        (Exclude<ValidSlotKeys, GetInternallyUsedSlotKeys<NodeKey, ValidInternalTransitionsType> | GetExternallyUsedSlotKeys<NodeKey, ValidExternalTransitionsType>>);

type ExtractValidSlotKeys<NodeKey extends string, ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType> = 
    GetUnusedSlotKeys<NodeKey, GetValidSlotKeys<NodeKey, ValidNodesType>, ValidInternalTransitionsType, ValidExternalTransitionsType>;
    
export type ExtractValidInternalTransitionReturnType<DestinationNodeKeyType extends string, ValidNodesType> = 
    ValidNodesType extends NodeContainer<DestinationNodeKeyType, BaseNode<BaseSlotType<any, any>, infer ValidReturnType, any>> ? ValidReturnType : never;

export type ExtractValidExternalTransitionReturnType<DestinationSlotKeyType extends string, ValidSlotsType> =
    ValidSlotsType extends BaseSlotType<DestinationSlotKeyType, infer ValidReturnType> ? ValidReturnType : never;

export type ExtractValidTransitionArgument<SourceNodeKeyType extends string, SourceNodeSlotKeyType extends string, ValidNodesType> = 
    ValidNodesType extends NodeContainer<SourceNodeKeyType, infer NodeType> ? (
        NodeType extends BaseNode<infer SlotType, any, any> ? (
            SlotType extends WithArgumentsSlotType<infer SlotKeyType, infer SlotArgsType> ? (
                SlotKeyType extends SourceNodeSlotKeyType ? ( SlotArgsType ) : never) :
            never) : 
        never) : 
    never;
export type ExtractValidInternalTransitionFunctionType<SourceNodeKeyType extends string, SourceNodeSlotKeyType extends string, DestinationNodeKeyType extends string, ValidNodesType> =
    (args: ExtractValidTransitionArgument<SourceNodeKeyType, SourceNodeSlotKeyType, ValidNodesType>) => ExtractValidInternalTransitionReturnType<DestinationNodeKeyType, ValidNodesType>;

export type ExtractValidExternalTransitionFunctionType<SourceNodeKeyType extends string, SourceNodeSlotKeyType extends string, DestinationNodeKeyType extends string, ValidNodesType, ValidSlotsType> =
    (args: ExtractValidTransitionArgument<SourceNodeKeyType, SourceNodeSlotKeyType, ValidNodesType>) => ExtractValidExternalTransitionReturnType<DestinationNodeKeyType, ValidSlotsType>;
export type ExtractValidExternalSlotKeys<ValidSlotsType> = ValidSlotsType extends BaseSlotType<infer SlotKey, any> ? SlotKey : never;
export type ExtractValidStartTransitionFunctionType<StartNodeKeyType extends string, ValidNodesType, GraphInputType> = 
    (args: GraphInputType) => ExtractValidInternalTransitionReturnType<StartNodeKeyType, ValidNodesType>;

// Check whether the key of the node being added is duplicated.
export type NodeKeyArgumentType<NewKeyType extends string, ValidNodesType>= 
    NodeContainer<NewKeyType, never> extends ValidNodesType ? "The node key is duplicated." : NewKeyType;

// Check whether the key of the transition being added is duplicated.
export type TransitionKeyWithoutDuplicated<NewTransitionKey extends string, ValidTransitionsType> = 
    InternalTransition<NewTransitionKey, any, any, any, any> extends ValidTransitionsType ? "The transition key is duplicated." : NewTransitionKey;

export type SlotKeyWithoutDuplicated<NewSlotKey extends string, ValidSlots> = 
    BaseSlotType<NewSlotKey, never> extends ValidSlots ? "The slot key is duplicated." : NewSlotKey;

// Check whether the transition being added references an existing source node.
export type TransitionSourceNodeType<SourceNodeKeyType extends string, ValidNodesType> = 
    NodeContainer<SourceNodeKeyType, any> extends ValidNodesType ? SourceNodeKeyType : ExtractValidNodeKeys<ValidNodesType>;


// Check whether the transition being added references an existing slot of the source node, and whether that slot is not being used already.
export type TransitionSourceSlotType<SourceNodeKeyType extends string, SourceNodeSlotKeyType extends BaseSlotKeyType, ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType> =
    SourceNodeSlotKeyType extends ExtractValidSlotKeys<SourceNodeKeyType, ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType> ? 
        SourceNodeSlotKeyType : 
        ExtractValidSlotKeys<SourceNodeKeyType, ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType>;

// Check whether the transition being added references an existing destination node.
export type InternalTransitionDestinationNodeType<DestinationNodeKeyType extends string, ValidNodesType> =
    NodeContainer<DestinationNodeKeyType, any> extends ValidNodesType ? DestinationNodeKeyType: ExtractValidNodeKeys<ValidNodesType>;

// Check whether the transition being added references an existing slot.
export type ExternalTransitionDestinationSlotType<DestinationSlotKeyType extends string, ValidSlotsType> =
    BaseSlotType<DestinationSlotKeyType, any> extends ValidSlotsType ? DestinationSlotKeyType: ExtractValidExternalSlotKeys<ValidSlotsType>;

// Check whether the transition being added contains a function with the valid arguments and return types, given the input export type of the destination node
// and the output export type of the source slot.
export type InternalTransitionFunctionType<SourceNodeKeyType extends string, SourceNodeSlotKeyType extends string, DestinationNodeKeyType extends string, NewFunType extends BaseTransitionFunction, ValidNodesType> = 
    NodeContainer<DestinationNodeKeyType, BaseNode<any, ReturnType<NewFunType>, any>> extends ValidNodesType ? 
        (NodeContainer<SourceNodeKeyType, BaseNode<BaseSlotType<SourceNodeSlotKeyType, Parameters<NewFunType>[0]>, never, never>> extends CastToBaseNodes<ValidNodesType> ? 
            NewFunType : 
            ExtractValidInternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, ValidNodesType>) :
        ExtractValidInternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, ValidNodesType>;

// Check whether the transition being added contains a function with the valid arguments and return types, given the input export type of the destination slot
// and the output export type of the source slot.
export type ExternalTransitionFunctionType<SourceNodeKeyType extends string, SourceNodeSlotKeyType extends string, DestinationSlotKeyType extends string, NewFunType extends BaseTransitionFunction, ValidNodesType, ValidSlotsType> = 
    BaseSlotType<DestinationSlotKeyType, any> extends ValidSlotsType ? 
        (NodeContainer<SourceNodeKeyType, BaseNode<BaseSlotType<SourceNodeSlotKeyType, Parameters<NewFunType>[0]>, never, never>> extends CastToBaseNodes<ValidNodesType> ? 
            NewFunType : 
            ExtractValidExternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationSlotKeyType, ValidNodesType, ValidSlotsType>) :
        ExtractValidExternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationSlotKeyType, ValidNodesType, ValidSlotsType>;


export type StartTransitionFunctionType<StartNodeKeyType extends string, NewFunType extends BaseTransitionFunction, ValidNodesType, GraphInputType> =
    NodeContainer<StartNodeKeyType, BaseNode<any, ReturnType<NewFunType>, any>> extends ValidNodesType ? (
        Parameters<NewFunType>[0] extends GraphInputType ? NewFunType : ExtractValidStartTransitionFunctionType<StartNodeKeyType, ValidNodesType, GraphInputType>
    ) : ExtractValidStartTransitionFunctionType<StartNodeKeyType, ValidNodesType, GraphInputType>;

// Check whether the initial node key refers an existing node key.
export type InitialNodeArgumentType<InitialNodeKeyType extends string, ValidNodesType> = 
    NodeContainer<InitialNodeKeyType, any> extends ValidNodesType ? InitialNodeKeyType : (ValidNodesType extends NodeContainer<infer ValidInitialNodeKeys, any> ? ValidInitialNodeKeys : never);