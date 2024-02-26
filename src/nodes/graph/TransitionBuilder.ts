import { BaseTransitionFunction, ExternalTransition, InternalTransition } from "./TransitionTypes.js";
import { ExternalTransitionDestinationSlotType, ExternalTransitionFunctionType, InitialNodeArgumentType, InternalTransitionDestinationNodeType,
     InternalTransitionFunctionType, StartTransitionFunctionType, TransitionKeyWithoutDuplicated, TransitionSourceNodeType, TransitionSourceSlotType } from "../GraphValidationTypes.js";
import { BasePayloadType } from "../PayloadTypes.js";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType, ExtractSlotKeyTypeFromSlot } from "../SlotTypes.js";
import { NodeGraph } from "./GraphNode.js";
import { AnyNode } from '../AnyNode.js';
import { NodeContainer, ExtractNodeType } from '../NodeContainer.js';


export type TransitionBuilder<ValidNodesType extends NodeContainer<string, AnyNode>, ValidSlotsType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, 
    ValidInternalTransitionsType extends InternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>,
    ValidExternalTransitionsType extends ExternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>, RequiredPayloadType extends BasePayloadType> = {

    addInternalTransition: 
        <NewTransitionKey extends string, SourceNodeKeyType extends string, SourceNodeSlotKeyType extends BaseSlotKeyType, 
        DestinationNodeKeyType extends string, NewFunType extends BaseTransitionFunction>

            (transitionKey: TransitionKeyWithoutDuplicated<NewTransitionKey, ValidInternalTransitionsType>, 
                sourceNode: TransitionSourceNodeType<SourceNodeKeyType, ValidNodesType>, 
                sourceSlot: TransitionSourceSlotType<SourceNodeKeyType, SourceNodeSlotKeyType, ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType>, 
                dest: InternalTransitionDestinationNodeType<DestinationNodeKeyType, ValidNodesType>,
                fun?: InternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, NewFunType, ValidNodesType>) => 

        TransitionBuilder<ValidNodesType, ValidSlotsType, InternalTransition<NewTransitionKey, SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, NewFunType> | ValidInternalTransitionsType, ValidExternalTransitionsType, RequiredPayloadType>;


    addExternalTransition:
        <NewTransitionKey extends string, SourceNodeKeyType extends string, SourceNodeSlotKeyType extends BaseSlotKeyType, 
        DestinationSlotKeyType extends string, NewFunType extends BaseTransitionFunction>

            (transitionKey: TransitionKeyWithoutDuplicated<NewTransitionKey, ValidInternalTransitionsType>, 
                sourceNode: TransitionSourceNodeType<SourceNodeKeyType, ValidNodesType>, 
                sourceSlot: TransitionSourceSlotType<SourceNodeKeyType, SourceNodeSlotKeyType, ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType>, 
                dest: ExternalTransitionDestinationSlotType<DestinationSlotKeyType, ValidSlotsType>,
                fun?: ExternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationSlotKeyType, NewFunType, ValidNodesType, ValidSlotsType>) => 

        TransitionBuilder<ValidNodesType, ValidSlotsType, ValidInternalTransitionsType, ExternalTransition<NewTransitionKey, SourceNodeKeyType, SourceNodeSlotKeyType, DestinationSlotKeyType, NewFunType> | ValidExternalTransitionsType, RequiredPayloadType>;
    

    
    done: <InitialNodeKeyType extends string, NewFunType extends BaseTransitionFunction, InputType>(initialNode: InitialNodeArgumentType<InitialNodeKeyType, ValidNodesType>, inputFun?: StartTransitionFunctionType<InitialNodeKeyType, NewFunType, ValidNodesType, InputType>, defaultInput?: InputType) => 

        NodeGraph<ExtractNodeType<ValidNodesType>, ValidInternalTransitionsType, ValidExternalTransitionsType, ValidSlotsType, InputType, RequiredPayloadType>;

}


export function updateTransitionsBuilder<ValidNodesType extends NodeContainer<string, AnyNode>, ValidSlotsType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, 
        ValidInternalTransitionsType extends InternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>, 
        ValidExternalTransitionsType extends ExternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>, RequiredPayloadType extends BasePayloadType>
        
        (nodes: ValidNodesType[], slots: {[key in ExtractSlotKeyTypeFromSlot<ValidSlotsType>]: any}, internalTransitions: ValidInternalTransitionsType[], externalTransitions: ValidExternalTransitionsType[]): 
            TransitionBuilder<ValidNodesType, ValidSlotsType, ValidInternalTransitionsType, ValidExternalTransitionsType, RequiredPayloadType> {
        
        return {
            addInternalTransition:
                <NewTransitionKey extends string, SourceNodeKeyType extends string, SourceNodeSlotKeyType extends BaseSlotKeyType, 
                DestinationNodeKeyType extends string, NewFunType extends BaseTransitionFunction>
                
                (transitionKey: TransitionKeyWithoutDuplicated<NewTransitionKey, ValidInternalTransitionsType>, 
                    sourceNode: TransitionSourceNodeType<SourceNodeKeyType, ValidNodesType>, 
                    sourceSlot: TransitionSourceSlotType<SourceNodeKeyType, SourceNodeSlotKeyType, ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType>,
                    dest: InternalTransitionDestinationNodeType<DestinationNodeKeyType, ValidNodesType>, 
                    fun?: InternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, NewFunType, ValidNodesType>) => {

                return updateTransitionsBuilder
                    <ValidNodesType, ValidSlotsType, InternalTransition<NewTransitionKey, SourceNodeKeyType, SourceNodeSlotKeyType, DestinationNodeKeyType, NewFunType> | ValidInternalTransitionsType, ValidExternalTransitionsType, RequiredPayloadType>
                    (nodes, slots, [{key: transitionKey as NewTransitionKey, sourceNode: sourceNode as SourceNodeKeyType,
                         sourceSlot: sourceSlot as SourceNodeSlotKeyType, dest: dest as DestinationNodeKeyType, fun: fun as NewFunType, transitionType: "INTERNAL"}, ...internalTransitions], externalTransitions);
            },

            addExternalTransition:
                <NewTransitionKey extends string, SourceNodeKeyType extends string, SourceNodeSlotKeyType extends BaseSlotKeyType, 
                DestinationSlotKeyType extends string, NewFunType extends BaseTransitionFunction>
                
                (transitionKey: TransitionKeyWithoutDuplicated<NewTransitionKey, ValidInternalTransitionsType>, 
                    sourceNode: TransitionSourceNodeType<SourceNodeKeyType, ValidNodesType>, 
                    sourceSlot: TransitionSourceSlotType<SourceNodeKeyType, SourceNodeSlotKeyType, ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType>,
                    dest: ExternalTransitionDestinationSlotType<DestinationSlotKeyType, ValidSlotsType>, 
                    fun?: ExternalTransitionFunctionType<SourceNodeKeyType, SourceNodeSlotKeyType, DestinationSlotKeyType, NewFunType, ValidNodesType, ValidSlotsType>) => {

                return updateTransitionsBuilder
                    <ValidNodesType, ValidSlotsType, ValidInternalTransitionsType, ExternalTransition<NewTransitionKey, SourceNodeKeyType, SourceNodeSlotKeyType, DestinationSlotKeyType, NewFunType> | ValidExternalTransitionsType, RequiredPayloadType>
                    (nodes, slots, internalTransitions, [{key: transitionKey as NewTransitionKey, sourceNode: sourceNode as SourceNodeKeyType,
                        sourceSlot: sourceSlot as SourceNodeSlotKeyType, dest: dest as DestinationSlotKeyType, fun: fun as NewFunType, transitionType: "EXTERNAL"}, ...externalTransitions]);
            },

            done: <InitialNodeKeyType extends string, NewFunType extends BaseTransitionFunction, InputType>
                (initialNode: InitialNodeArgumentType<InitialNodeKeyType, ValidNodesType>, inputFun?: StartTransitionFunctionType<InitialNodeKeyType, NewFunType, ValidNodesType, InputType>, defaultInput?: InputType) => {


                const resultNodes: {[key in string]: ValidNodesType} = {};
                nodes.forEach(element => {
                    resultNodes[element.key] = element;
                });
                const resultInternalTransitions: {[key in string]: ValidInternalTransitionsType} = {};
                internalTransitions.forEach(element => {
                    resultInternalTransitions[(element as any).key] = element;
                });

                const resultExternalTransitions: {[key in string]: ValidExternalTransitionsType} = {};
                externalTransitions.forEach(element => {
                    resultExternalTransitions[(element as any).key] = element;
                });

                return new NodeGraph<ExtractNodeType<ValidNodesType>, ValidInternalTransitionsType, ValidExternalTransitionsType, ValidSlotsType, InputType, RequiredPayloadType>
                    ("", resultNodes as any, resultInternalTransitions, resultExternalTransitions, slots, initialNode, inputFun, defaultInput);

        }
    }
}