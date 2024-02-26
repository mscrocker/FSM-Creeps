import { AnyNode } from "../../../src/nodes/AnyNode.js";
import { BaseNode, NodeLoopReturnType } from "../../../src/nodes/BaseNode.js";
import { BaseInputType, ExtractNodeInputType } from "../../../src/nodes/InputTypes.js";
import { ExtractMemoryType } from "../../../src/nodes/MemoryTypes.js";
import { NodeAbortReason } from "../../../src/nodes/NodeAbortReason.js";
import { NodeContext, NodeContextImpl } from "../../../src/nodes/NodeContext.js";
import { BasePayloadType, ExtractNodePayloadType } from "../../../src/nodes/PayloadTypes.js";
import { BaseSlotArgsType, BaseSlotKeyType, BaseSlotType, ExtractSlotKeyTypeFromSlot, ExtractSlotType } from "../../../src/nodes/SlotTypes.js";
import { NodeWrapper } from "../../../src/nodes/wrapper/NodeWrapper.js";
import { setupGraph } from '../../../src/nodes/graph/GraphNode.js';
import { InitialNodeBuilder } from '../../../src/nodes/graph/NodeBuilder.js';
import { SlotArgumentsWithEmptyDefault } from '../../../src/nodes/SlotTypes.js';
import * as Sinon from 'sinon';
import { expect } from 'chai';

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
        return;
    }

    abort(reason: NodeAbortReason, memory: TestNodeMemory): void {
        
    }

};

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
    
    wrapperLoop(context: NodeContext<"MockWrapperTransitionA" | "MockWrapperTransitionB", any>, memory: TestWrapperMemory): "MockWrapperTransitionA" | TestWrapperSlotType | void {
        if (memory.wrapperMemory.abort){
            return "MockWrapperTransitionA";
        }
    }
    

    private shouldAbort: boolean;
    
    wrapperStart(args: WrappedInputType): TestWrapperMemory {
        return {wrapperMemory: {abort: this.shouldAbort}}
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


describe("Graph tests", () => {


    let testNodeA: TestNode;
    let testNodeB: TestWrapper<TestNode, TestNodeSlots, TestNodeInput, TestNodePayload, TestNodeMemory>;


    const initializeGraphClass = () => {

        const GraphClass = setupGraph("TestGraph", (builder: InitialNodeBuilder) => {
            
            return builder

                .addNode("TestNodeA", testNodeA)
                .addNode("TestNodeB", testNodeB)

                .addSlot("ExitPointA", SlotArgumentsWithEmptyDefault<{reason: string}>())

                .addInternalTransition("FromAToB", "TestNodeA", "MockTransitionA", "TestNodeB", (args) => {return {input: 0};})
                .addInternalTransition("FromBToA", "TestNodeB", "MockTransitionA", "TestNodeA", (args) => {return {input: 1}})

                .addExternalTransition("FromAToExit", "TestNodeA", "MockTransitionB", "ExitPointA")

                .done("TestNodeA", (args: {y:number}) => {return {input: 0};})

        });
        return new GraphClass();
    };

    let testGraph: ReturnType<typeof initializeGraphClass>;


    beforeEach(() => {
        testNodeA = new TestNode();
        testNodeB = new TestWrapper(false, new TestNode());
        testGraph = initializeGraphClass();
    });


    //-----------------
    //  INITIALIZATION
    //-----------------
    it("Should call the initial node start method when the graph start method is called", () => {

        const startNodeSpy = Sinon.spy(testNodeA, "start");

        testGraph.start({y: 0}, {payload: 0, wrapperPayload: 1});

        expect(startNodeSpy.calledOnce).to.equal(true);


    });

    it("Should store the memory from the initial node as part of the graph memory during initialization", () => {

        const startNodeSpy = Sinon.spy(testNodeA, "start");

        const graphMemory = testGraph.start({y: 0}, {payload: 3, wrapperPayload: 3});

        expect(graphMemory.currentNodeMemory).to.equal(startNodeSpy.returnValues[0]);

    });

    it("Should set the initial node as the current node during initialization", () => {

        const graphMemory = testGraph.start({y: 0}, {payload: 0, wrapperPayload: 2});

        expect(graphMemory.currentNode).to.equal(testGraph.initialNode);

    });


    //-----------------
    //  TRANSITIONING
    //-----------------

    it("Should initialize the destination node when the current node fires a transition", () => {

        Sinon.stub(testNodeA, "loop").callsFake((_context, _memory) => "MockTransitionA");
        const nodeBStartSpy = Sinon.spy(testNodeB, "start");

        const graphMemory = testGraph.start({y: 0}, {payload: 0, wrapperPayload: 1});
        testGraph.loop(new NodeContextImpl({}, []), graphMemory);

        expect(nodeBStartSpy.calledOnce).to.equal(true);
        expect(nodeBStartSpy.returnValues[0]).to.equal(graphMemory.currentNodeMemory);
        
    });

    it("Should set the current node to the destination when a transition is fired", () => {

        Sinon.stub(testNodeA, "loop").callsFake((_context, _memory) => "MockTransitionA");

        const graphMemory = testGraph.start({y: 0}, {payload: 0, wrapperPayload: 1});
        testGraph.loop(new NodeContextImpl({}, []), graphMemory);
        expect(graphMemory.currentNode).to.equal("TestNodeB");

    });

    it("Should fire an external transition when a transition to a slot is fired", () => {

        Sinon.stub(testNodeA, "loop").callsFake((_context, _memory) => {return {key: "MockTransitionB", args: {slotArg: 0}}});

        const graphMemory = testGraph.start({y: 0}, {payload: 0, wrapperPayload: 1});
        const loopResult = testGraph.loop(new NodeContextImpl({}, []), graphMemory);
        expect(loopResult).to.be.an("object").to.include({key: "ExitPointA"});

    });

    it("Should not fire an external transition when a transition to a node is fired", () => {

        Sinon.stub(testNodeA, "loop").callsFake((_context, _memory) => {return "MockTransitionA";});

        const graphMemory = testGraph.start({y: 0}, {payload: 0, wrapperPayload: 1});
        const loopResult = testGraph.loop(new NodeContextImpl({}, []), graphMemory);

        expect(loopResult).to.equal(undefined);

    });

    //-----------------
    //  ABORT
    //-----------------
    it("Should abort the current node execution when the graph gets aborted", () => {

        const startNodeSpy = Sinon.spy(testNodeA, "abort");
        Sinon.stub(testNodeA, "loop").callsFake((_context, _memory) => { return undefined; });

        
        const graphMemory = testGraph.start({y: 0}, {payload: 0, wrapperPayload: 1});
        testGraph.loop(new NodeContextImpl({}, []), graphMemory);

        testGraph.abort("AbortedByWrapper", graphMemory, {payload: 0, wrapperPayload: 1});

        expect(startNodeSpy.calledOnce).to.equal(true);

    });

});