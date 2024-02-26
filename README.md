# FSM-Creeps

This project is a library aimed towards allowing the usage of the [Finite-State-Machine](https://en.wikipedia.org/wiki/Finite-state_machine) (FSM) pattern to develop AI agents. It was originally designed to be used for the development of [Screeps](https://screeps.com) bots, although the library is not restricted to be used in this game and can, potentially, be used in any scenario that requires the development of agents which are expected to run under a NodeJS runtime.

## Features

This is a summary of the currently available features. Please keep in mind that most of this code is in an early stage of development and these features are experimental:

* Creating leaf tasks which can be initialized and updated.
* Developing wrapper tasks that can run code before the tasks being wrapped or act as guard conditions.
* Setting up graphs defining a FSM of tasks (being these leaf tasks, wrappers or other subgraphs).
* Static validation of the graphs using the type inference engine provided by TypeScript.
* Storing all the execution state in a single JS object, which implies:

  * Easy serialization.
  * Checkpointing the execution state.

## Roadmap

This is a list of possible future features that might become available at some point in the future, but are currently unsupported (again, it may change in the future):

* Inferring the types of the leaf and wrapper tasks directly from a call to an initialization method (simillar to how the graph tasks work).
* Flattenning the execution of the nodes by building a cache of all the transitions and nodes, speeding up the execution of the tasks.
* Allowing to store and define graphs into JSON files, thus allowing the hot-reload of source code in the agents.

## Usage

In order to use the library, the user must define three different types of tasks:

* Leaf tasks, which contain code able to fulfill the purpose of the task.
* Graph tasks with nodes and transitions.
* Wrapper tasks, which wrap another task ans can run code before the task.

### Leaf tasks

To implement these tasks, the user must create a class extending the provided BaseNode class. Also, in order to extend the BaseNode, the user must provide a set of type parameters which define the structure of the task. These parameters are as follows:

* **SlotType:** This parameter can be defined as an union type of all the "slots" that the node contains. A slot is a reason for which a transition might be fired from this node, and can optionally have some parameters associated with it.
* **PayloadType:** This parameter can be defined as an intersection type of all the "payloads" that the node requires. A payload is a pair containing a key and a value, that must be provided from the root graph to all the nodes that require it. Thus, this type allows the user to define objects that must be provided dynamically from the root of the execution.
* **MemoryType:** This parameter defines the shape of the "memory" object for this task. This object must contain all the data that the task needs to store among iterations, and it must be serializable to a JSON file.
* **InputType:** This parameter defines the dynamic input type of the task. As we mentioned earlier in the SlotType, it is possible to link arguments to a slot so that data can be sent to a transition. With this parameter, the user can provide the expected shape of the data coming from transitions.

After defining and setting up these types, the user is expected to provide an implementation for three different functions that make up the lifecycle of the task:

* **loop:** This method will be called once for each iteration. It is guaranteed that, for a given agent, only a call to the loop function will be made. This function receives two arguments: the first one is the context, which contains the payload, a call stack with the graphs and subgraphs containing this node and the function "slotIsEnabled" that returns whether in the containing graph a given slot has a transition registered; the second argument is the memory object, which is the only place where the user should store any information for a given agent that must survive between iterations. From this function the user can either not return anything (which means that no transition should be fired), return the name of a slot that has no arguments (firing the transition associated with it) or return an object containing the fields "key" with the name of a slot and "args" with its arguments (again, causing its transition to be fired).
* **start:** This method will be called each time a task will start its execution. It won't be run in a separate iteration from the **loop** function so no orders should be issued to the agent during this step. The goal of this function is to receive the dynamic input arguments sent by the transition and to return the initial value for the memory object.
* **abort:** This method will be called each time that a task gets aborted due to an external factor (e.g. a wrapper containing this task fired a transition which ends the execution of this task). Again, this function won't run in a separate iteration from the **loop** function, so it is not recommended to issue orders from this method. The purpose of this function is to release any resources that the task might have reserved either during the **loop** stage or at the **start** phase. This function receives both the reason that caused the task to be aborted, and the memory object.

An example of a leaf node is provided at the *BaseGraphTest*:

```typescript
type TestNodeSlots = 
    BaseSlotType<"MockTransitionA"> |
    BaseSlotType<"MockTransitionB", {slotArg: number}>;

type TestNodeInput = {input: number};

type TestNodePayload = {payload: number};

type TestNodeMemory = {memory: number};

class TestNode extends BaseNode<TestNodeSlots, TestNodeInput, TestNodePayload, TestNodeMemory> {
  
    start(args: TestNodeInput): TestNodeMemory {
        return { memory: args.input+1 };
    }

    loop(context: NodeContext<ExtractSlotKeyTypeFromSlot<TestNodeSlots>, TestNodePayload>, memory: TestNodeMemory): NodeLoopReturnType<TestNodeSlots> {
    
    }

    abort(reason: NodeAbortReason, memory: TestNodeMemory): void {
    
    }

};
```

### Graph tasks

To implement a graph task, the user must call the **setupGraph** function of the library. This function will receive two parameters: a name for the graph, and a function describing the process to build the graph structure. An example of the creation (which can be found in the *BaseGraphTest*) of one of such graphs would be:

```typescript
const GraphClass = setupGraph("TestGraph", (builder: InitialNodeBuilder) => builder

        .addNode("TestNodeA", testNodeA)
        .addNode("TestNodeB", testNodeB)

        .addSlot("ExitPointA", SlotArgumentsWithEmptyDefault<{reason: string}>())

        .addInternalTransition("FromAToB", "TestNodeA", "MockTransitionA", "TestNodeB", (args) => {return {input: 0};})
        .addInternalTransition("FromBToA", "TestNodeB", "MockTransitionA", "TestNodeA", (args) => {return {input: 1}})

        .addExternalTransition("FromAToExit", "TestNodeA", "MockTransitionB", "ExitPointA")

        .done("TestNodeA", (args: {y:number}) => {return {input: 0};})

);
```

As it can be seen, the configuration of the graph takes these steps:

1. The nodes must be added with the **addNode** function, specifying a unique key and the node type.
2. The slots (i.e., exit nodes) must be defined with the **addSlot** function, including the default value for the arguments of this slot (or, as it can be seen, a call to **SlotArgumentsWithEmptyDefaultSlot** in order to not provide a default value).
3. The internal transitions between nodes of the graph are defined through calls to the **addInternalTransition** function, specifying as arguments (in the given order): a unique key for the transition, the source node, the slot of the source node that would fire this transition, the destination node and, optionally, a function that takes the arguments of the slot of the source node and transforms this data into the input type of the destination node.
4. The external transitions from nodes of the graph to its slots are defined calling to the **addExternalTransition** function, with the following arguments: a unique key for the transition, the source node, the slot of the source node that would fire this transition, the destination node and, optionally, a function that takes the arguments of the slot of the source node and transforms this data into the arguments of the destination slot.
5. A call to the **done** function, indicating the initial node, and a function that receives the dynamic input of the graph and transforms it into the dynamic input of this starting node.

A main feature of this library is its ability to infer the types from the elements being defined in the graph and to statically check, using the inference engine provided by TypeScript, whether the graph is valid or not. Among these validations, the library will check that:

* No duplicate keys are used for the nodes, slots or transitions.
* The transitions always refer to existing source and destination nodes or slots.
* The slots firing a transition actually exist in the source nodes.
* The arguments of the functions provided with the transitions are contained in the source slot arguments.
* The return type of the functions provided with the transitions are the ones defined in either the input type of the destination nodes or the arguments of the destination slot.
* The starting node actually exist.
* The return type of the initial function matches the input type of the starting node.

### Wrapper tasks

These tasks are defined in a very similar fashion to the leaf tasks. In this case, the class that the user will define must extend the **NodeWrapper** class.

Also, instead of providing only types for the **SlotTypes**, **InputTypes**, **PayloadTypes** and **MemoryTypes** of the node itself, it is also necessary to provide these types also for the wrapped node (it is expected that the user will parametrize their wrapper class so that the wrapped node provides these types however).

Finally, rather than providing an implementation for the **loop**, **abort** and **start** methods, the user must define the **wrapperLoop**, **wrapperAbort** and **wrapperStart** methods for its wrapper. This methods have an analogue behaviour to those previously explained for the leaf tasks. However, it is important to keep in mind that, whenever the user fires a transition from **wrapperLoop** method, the wrapped node execution will be aborted.

Again, in the file *BaseGraphTest* we can find an example of the creation of a wrapper:

```typescript
type TestWrapperSlotType = 
    BaseSlotType<"MockWrapperTransitionA"> |
    BaseSlotType<"MockWrapperTransitionB", {wrapperSlotArg: number}>;

type TestWrapperMemory = {wrapperMemory: {
    abort: boolean
}};

type TestWrapperPayload = {wrapperPayload: number};

class TestWrapper<
    WrappedNode extends AnyNode,
    WrappedSlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType> = ExtractSlotType<WrappedNode>, 
    WrappedInputType extends BaseInputType = ExtractNodeInputType<WrappedNode>, 
    WrappedPayload extends BasePayloadType = ExtractNodePayloadType<WrappedNode>, 
    WrappedMemory extends {} = ExtractMemoryType<WrappedNode>> 
  
    extends NodeWrapper<WrappedSlotType, WrappedInputType, WrappedPayload, WrappedMemory, TestWrapperSlotType, WrappedInputType, TestWrapperPayload, TestWrapperMemory> {
  

    private shouldAbort: boolean;
  
    wrapperStart(args: WrappedInputType): TestWrapperMemory {
        return {wrapperMemory: {abort: this.shouldAbort}}
    }

    wrapperLoop(context: NodeContext<ExtractSlotKeyTypeFromSlot<TestWrapperSlotType>, any>, memory: TestWrapperMemory): NodeLoopReturnType<TestWrapperSlotType> {
        if (memory.wrapperMemory.abort){
            return "MockWrapperTransitionA";
        }
    }

    wrapperAbort(reason: NodeAbortReason, memory: TestWrapperMemory) {
      
    }

    preprocessDynamicInput(args: WrappedInputType): WrappedInputType {
        return args;
    }

    constructor(shouldAbort: boolean, node: BaseNode<WrappedSlotType, WrappedInputType, WrappedPayload, WrappedMemory>){
        super(node);
        this.shouldAbort = shouldAbort;
    }
  
}
```
