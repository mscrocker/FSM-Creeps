import { BaseNode } from "./BaseNode.js";
import { ExtractNodeInputType } from "./InputTypes.js";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType } from "./SlotTypes.js";

/**
 * Auxiliary type to store a given node within a graph node. It has fields for saving the default value for the dynamic input, and the key
 * associated with that node.
 */
export type NodeContainer<KeyType extends string, NodeClassType extends BaseNode<BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, any, any>> = {
    
    /**
     * The key used to store the node in the graph.
     */
    key: KeyType;

    /**
     * The default value for incoming transitions into this node.
     */
    defaultInput?: ExtractNodeInputType<NodeClassType>;
    
    /**
     * The instance of the node being wrapped by this container.
     */
    nodeInstance: NodeClassType;
}

/**
 * Auxiliary type to cast a given node type to the BaseNode that it is extending.
 */
type ExtractNodeTypeAsBaseNode<Node> = Node extends NodeContainer<any, BaseNode<infer SlotType, infer InputType, infer RequiredPayloadType>> ? BaseNode<SlotType, InputType, RequiredPayloadType> : never;

/**
 * Auxiliary type to infer the wrapped node type out of a given container type.
 */
export type ExtractNodeType<Node> = Node extends NodeContainer<any, infer NodeType> ? NodeType : never; 

/**
 * Auxiliary type to infer the node key of a given container type.
 */
export type ExtractNodeKey<Node> = Node extends NodeContainer<infer KeyType, any> ? KeyType : never;

/**
 * Auxiliary type to convert a NodeContainer with a given node type to a NodeContainer with the BaseNode being extended by that node.
 */
export type CastToBaseNodes<Nodes> = NodeContainer<ExtractNodeKey<Nodes>, ExtractNodeTypeAsBaseNode<Nodes>>;