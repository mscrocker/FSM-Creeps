import { BaseNode } from "../../nodes/BaseNode.js";
import { NodeAbortReason } from "../../nodes/NodeAbortReason.js";
import { NodeBuilder, updateNodesBuilder } from "../../nodes/graph/NodeBuilder.js";
import { BasePayloadType } from "../../nodes/PayloadTypes.js";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType, EmptySlotType, ExtractSlotKeyTypeFromSlot } from "../../nodes/SlotTypes.js";
import { AnyNode } from '../AnyNode.js';
import { NodeLoopReturnType } from '../BaseNode.js';
import { NodeContextImpl } from '../NodeContext.js';
import { GraphStackFrame } from "./GraphStackFrame.js";
import { InternalTransition, BaseTransitionFunction, ExternalTransition } from './TransitionTypes.js';
import { NodeContainer } from "../../nodes/NodeContainer.js";
import { WithArgumentsSlotType } from '../SlotTypes.js';


/**
 * The type of the memory used by a graph node.
 */
interface GraphMemory {
    currentNode: string;
    currentNodeMemory: any;
}

/**
 * Base class for all the graphs that are defined in the FSM-Creeps library. This graph is able to set up nodes based either on tasks, wrappers or other subgraphs, and to
 * fire transitions amongst these nodes. Also, it is possible to fire external transitions from nodes of this graph by creating transitions targeted at exit nodes (the
 * "slots").
 * @typeParam ValidNodesType Union type of all the nodes contained in the graph.
 * @typeParam ValidInternalTransitionsType Union type of all the internal transitions contained in the graph.
 * @typeParam ValidExternalTransitionsType Union type of all the external transitions contained in the graph.
 * @typeParam ValidSlotsType Union type of all the slots contained in the graph.
 * @typeParam GraphInputType Type of the dynamic input of the graph provided by an incoming external transition.
 * @typeParam RequiredPayloadType Intersection type of all the payloads required by the graph.
 */
export class NodeGraph
            <ValidNodesType extends AnyNode, ValidInternalTransitionsType extends InternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>, 
            ValidExternalTransitionsType extends ExternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>, 
            ValidSlotsType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, GraphInputType, RequiredPayloadType extends BasePayloadType> 
        
        extends BaseNode<ValidSlotsType, GraphInputType, RequiredPayloadType, GraphMemory> {


    // Quick hack to allow the type inference engine to obtain the payload of the graph.
    //@ts-ignore
    _payload: RequiredPayloadType;
    
    override start(args: GraphInputType, payload: RequiredPayloadType): GraphMemory {
        
        let startArgs = undefined;
        if (this.initialFun){
            startArgs = this.initialFun(args);
        }

        const initialNode = this.nodes[this.initialNode];
        
        const nodeMemory = initialNode.nodeInstance.start(startArgs ?? initialNode.defaultInput, payload);
        

        return {
            currentNode: this.initialNode,
            currentNodeMemory: nodeMemory
        };

    }

    override loop(context: NodeContextImpl<ExtractSlotKeyTypeFromSlot<ValidSlotsType>, any>, memory: GraphMemory): NodeLoopReturnType<ValidSlotsType> {
        
        const currentNode = this.nodes[memory.currentNode];

        const graphFrame: GraphStackFrame = {
            graphName: this.graphName,
            nodeName: memory.currentNode,
            registeredSlots: currentNode.nodeInstance._slotTypes as unknown as string[]  // TODO: cache and send registered slot types
        };

        const executionResult = currentNode.nodeInstance.loop(context.pushStackFrame(graphFrame), memory.currentNodeMemory);

        if (executionResult){
            // Transition fired

            let destinationSlotKey: string;

            if (typeof executionResult === "string"){
                destinationSlotKey = executionResult;
            } else {
                destinationSlotKey = executionResult.key;
            }


            const {transitionKey, isInternalTransition} = this.transitionKeys[memory.currentNode][destinationSlotKey];
            

            if (isInternalTransition) {
                const transition = this.internalTransitions[transitionKey];
                
                const destination = this.nodes[transition.dest];

                
                let startArguments = destination.defaultInput;
                
                if (transition.fun){
                    
                    const transitionFunArgs = (executionResult as WithArgumentsSlotType<BaseSlotKeyType, BaseSlotArgsType>).args;

                    startArguments = transition.fun(transitionFunArgs);

                }

                memory.currentNodeMemory = destination.nodeInstance.start(startArguments, context.getPayload());
                memory.currentNode = transition.dest;

            } else {
                const transition = this.externalTransitions[transitionKey];

                let outputArguments = this.slots[transition.dest];
                
                if (transition.fun){

                    const transitionFunArgs = (executionResult as WithArgumentsSlotType<BaseSlotKeyType, BaseSlotArgsType>).args;

                    outputArguments = transition.fun(transitionFunArgs);
                }

                return {
                    key: transition.dest,
                    args: outputArguments
                } as unknown as ValidSlotsType;

            }   

        }
    }

    override abort(reason: NodeAbortReason, memory: GraphMemory, payload: RequiredPayloadType): void {
        const currentNode = this.nodes[memory.currentNode];

        currentNode.nodeInstance.abort(reason, memory.currentNodeMemory, payload);
    }

    /**
     * The name of the graph.
     */
    public readonly graphName: string;

    /**
     * Object containing the nodes of the graph, indexed by their key.
     */
    private readonly nodes: Readonly<{[key: string]: NodeContainer<string, ValidNodesType>}>;

    /**
     * Object containing the internal transitions of the graph, indexed by their key.
     */
    private readonly internalTransitions: Readonly<{[key: string]: ValidInternalTransitionsType}>;

    /**
     * Object containing the external transitions of the graph, indexed by their key.
     */
    private readonly externalTransitions: Readonly<{[key: string]: ValidExternalTransitionsType}>;

    /**
     * Object containing the slots of the graph, indexed by their key and with the arguments as the value.
     */
    private readonly slots: Readonly<{[key: string]: BaseSlotArgsType}>;

    /**
     * Key of the initial node of the graph.
     */
    public readonly initialNode: string;

    /**
     * Map indexable by the source node key and the source slot key, which contains the transition key and whether is internal or external.
     */
    private readonly transitionKeys: Readonly<{[nodeKey: string]: {[slotKey: string]: {transitionKey: string, isInternalTransition: boolean}}}>

    /**
     * Function in charge of preprocessing the dynamic input of the graph in order to send it to the starting node.
     */
    private readonly initialFun?: (args: GraphInputType) => any;

    /**
     * Default value for the dynamic input of the graph.
     */
    private readonly defaultInitialInput?: GraphInputType;

    /**
     * Constructor of the graph.
     * @param graphName The name of the graph
     * @param nodes Object containing the nodes of the graph, indexed by their key.
     * @param internalTransitions Object containing the internal transitions of the graph, indexed by their key.
     * @param externalTransitions Object containing the external transitions of the graph, indexed by their key.
     * @param slots Object containing the slots of the graph, indexed by their key and with the arguments as the value.
     * @param initialNode Key of the initial node of the graph.
     * @param inputFun Function in charge of preprocessing the dynamic input of the graph in order to send it to the starting node.
     * @param defaultInitialInput Default value for the dynamic input of the graph.
     */
    constructor(graphName: string, nodes: {[key: string]: NodeContainer<string, ValidNodesType>}, internalTransitions: {[key: string]: ValidInternalTransitionsType}, externalTransitions:  {[key: string]: ValidExternalTransitionsType}, 
        slots: {[key: string]: ValidSlotsType}, initialNode: string, inputFun?: (args: GraphInputType) => any, defaultInitialInput?: GraphInputType){

        super();

        this.graphName = graphName;
        this.nodes = nodes;
        this.internalTransitions = internalTransitions;
        this.externalTransitions = externalTransitions;
        this.slots = slots;
        this.initialNode = initialNode;
        this.defaultInitialInput = defaultInitialInput;
        this.initialFun = inputFun;


        const transitionKeys: {[nodeKey: string]: {[slotKey: string]: {transitionKey: string, isInternalTransition: boolean}}} = {};

        for(let transitionKey in internalTransitions){
            
            if (!(internalTransitions[transitionKey].sourceNode in transitionKeys)){
                transitionKeys[internalTransitions[transitionKey].sourceNode] = {}
            }
            transitionKeys[internalTransitions[transitionKey].sourceNode][internalTransitions[transitionKey].sourceSlot] = {
                transitionKey,
                isInternalTransition: true
            }
            
        }

        for(let transitionKey in externalTransitions){
            
            if (!(externalTransitions[transitionKey].sourceNode in transitionKeys)){
                transitionKeys[externalTransitions[transitionKey].sourceNode] = {}
            }
            transitionKeys[externalTransitions[transitionKey].sourceNode][externalTransitions[transitionKey].sourceSlot] = {
                transitionKey,
                isInternalTransition: false
            }
            
        }


        this.transitionKeys = transitionKeys;
        


    }

    /**
     * Auxiliary method used to define a new graph class out of a graph name and a function returning the shape of the graph.
     * @param graphName The name of the graph.
     * @param fun The function that defines the shape of the graph.
     * @returns The new graph class.
     */
    public static createBasicGraph<ValidNodesType extends AnyNode, ValidInternalTransitionsType extends InternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>,
        ValidExternalTransitionsType extends ExternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>, ValidSlotsType extends EmptySlotType<string>, 
        RequiredPayloadType extends BasePayloadType, StaticArgsType extends unknown[], DynamicArgsType extends any>
        
        (graphName: string, fun: (builder: NodeBuilder<never, never, BasePayloadType>, ...args: StaticArgsType) => NodeGraph<ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType, ValidSlotsType, DynamicArgsType, RequiredPayloadType>): 
            new (...args: StaticArgsType) => NodeGraph<ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType, ValidSlotsType, DynamicArgsType, RequiredPayloadType> {

        class AuxGraph extends NodeGraph<ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType, ValidSlotsType, DynamicArgsType, RequiredPayloadType> {
            constructor(...args: StaticArgsType){
                const builder = updateNodesBuilder<never, never, BasePayloadType>([], {});
                const aux = fun(builder, ...args);
                super(graphName, aux.nodes, aux.internalTransitions, aux.externalTransitions, aux.slots, aux.initialNode, aux.initialFun, aux.defaultInitialInput);
            }
        }

        return AuxGraph;

    }

}

/**
 * This function is able to generate a new graph class, provided a name for the graph and a generator function that, given a builder object, can generate a complete graph with the expected internal structure.
 * In order to use this function the user is expected to chain-call the methods of the provided builder object, defining the graph in a particular order (first the nodes and slots, then the transitions and
 * finally calling to the "done" method which allows to choose the initial node). Once the graph is complete, the resulting object must be returned by this function. Note that the builder object is able to keep
 * track of the previously added elements and provide useful validations for the subsequent calls.
 * 
 * @param graphName The name for the graph class being created.
 * @param fun The function used to setup the graph structure. It receives two parameters: the first one (mandatory) being the builder object used to set up the graph; the second one (optional) being an object 
 * with parameters that the resulting graph class will receive on its constructor.
 * @returns A new class containing the graph logic defined within the initialization function.
 */
export function setupGraph<ValidNodesType extends AnyNode, ValidInternalTransitionsType extends InternalTransition<string, string, BaseSlotKeyType, string>, 
    ValidExternalTransitionsType extends ExternalTransition<string, string, BaseSlotKeyType, string, BaseTransitionFunction>, ValidSlotsType extends EmptySlotType<string>, 
    RequiredPayloadType extends BasePayloadType, StaticArgsType extends unknown[], DynamicArgsType extends any>
    
    (graphName: string, fun: (builder: NodeBuilder<never, never, BasePayloadType>, ...args: StaticArgsType) => NodeGraph<ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType, ValidSlotsType, DynamicArgsType, RequiredPayloadType>): 
        new (...args: StaticArgsType) => NodeGraph<ValidNodesType, ValidInternalTransitionsType, ValidExternalTransitionsType, ValidSlotsType, DynamicArgsType, RequiredPayloadType> {


            
    return NodeGraph.createBasicGraph(graphName, fun);
}   

