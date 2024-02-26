import { BaseSlotType, ExtractSlotKeyTypeFromSlot, BaseSlotKeyType, BaseSlotArgsType, ExtractSlotType } from '../../../src/nodes/SlotTypes.js';
import { BaseNode, NodeLoopReturnType } from '../../../src/nodes/BaseNode.js';
import { NodeContext, NodeContextImpl } from '../../../src/nodes/NodeContext.js';
import { NodeAbortReason } from '../../../src/nodes/NodeAbortReason.js';
import { NodeWrapper } from '../../../src/nodes/wrapper/NodeWrapper.js';
import { AnyNode } from '../../../src/nodes/AnyNode.js';
import { BaseInputType, ExtractNodeInputType } from '../../../src/nodes/InputTypes.js';
import { BasePayloadType, ExtractNodePayloadType } from '../../../src/nodes/PayloadTypes.js';
import { ExtractMemoryType } from '../../../src/nodes/MemoryTypes.js';
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
        ;
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
    
    wrapperLoop(context: NodeContext<'MockWrapperTransitionA' | 'MockWrapperTransitionB', any>, memory: TestWrapperMemory): 'MockWrapperTransitionA' | TestWrapperSlotType | void {
        if (memory.wrapperMemory.abort){
            return "MockWrapperTransitionA";
        }
        return;
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


describe("Guard tests", () => {

    let testNode: TestNode;
    let testWrapper: TestWrapper<TestNode, TestNodeSlots, TestNodeInput, TestNodePayload, TestNodeMemory>;



    beforeEach(() => {
        testNode = new TestNode();
        testWrapper = new TestWrapper(false, testNode);
    });


    // ---------------------
    // LOOP CHECKS
    // ---------------------
    it("Should call the loop function of the node when the wrapper loop is called", () => {

        
        const loopStub = Sinon.stub(testNode, "loop");

        
        testWrapper.loop(
            new NodeContextImpl({wrapperPayload: 0, payload: 0}, []), {
                wrappedMemory: {memory: 0}, 
                wrapperMemory: {wrapperMemory: {abort: false}}
            }
        );

        expect(loopStub.calledOnce).to.equal(true);
        
        
    });
    
    it("Should not call the loop function of the node when the wrapper loop fires a transition", () => {
        
        const loopStub = Sinon.stub(testNode, "loop");

        
        testWrapper.loop(
            new NodeContextImpl({wrapperPayload: 0, payload: 0}, []), {
                wrappedMemory: {memory: 0}, 
                wrapperMemory: {wrapperMemory: {abort: true}}
            }
        );   

        expect(loopStub.calledOnce).to.equal(false);

    });

    it("Should not return void when the loop function of the wrapper fires a transition", () => {
        
        const returnValue = testWrapper.loop(
            new NodeContextImpl({wrapperPayload: 0, payload: 0}, []), {
                wrappedMemory: {memory: 0}, 
                wrapperMemory: {wrapperMemory: {abort: true}}
            }
        );   

        expect(returnValue).to.not.equal(null);

    });

    // ---------------------
    // ABORT CHECKS
    // ---------------------

    it("Should call the abort function of the node when the wrapper loop fires a transition", () => {
        
        const abortStub = Sinon.stub(testNode, "abort");

        
        testWrapper.loop(
            new NodeContextImpl({wrapperPayload: 0, payload: 0}, []), {
                wrappedMemory: {memory: 0}, 
                wrapperMemory: {wrapperMemory: {abort: true}}
            }
        );   

        expect(abortStub.calledOnce).to.equal(true);

    });

    
    // ---------------------
    // START CHECKS
    // ---------------------

    it("Should call the start function of the node when the start function of the wrapper gets called", () => {
        
        const startStub = Sinon.stub(testNode, "start");

        testWrapper.start({input: 10}, {wrapperPayload: 0, payload: 0});   

        expect(startStub.calledOnce).to.equal(true);

    });

    it("Should return the initial memory of the node as part of the initial memory of the wrapper", () => {
        
        const startStub = Sinon.spy(testNode, "start");

        const wrapperInitialMemory = testWrapper.start({input: 10}, {wrapperPayload: 0, payload: 0});   

        expect(wrapperInitialMemory.wrappedMemory).to.equal(startStub.returnValues[0]);

    });

    it("Should call the start function of the node with the result of the preprocessDynamicInput method of the wrapper", () => {
        
        const startSpy = Sinon.spy(testNode, "start");
        const preprocessInputSpy = Sinon.spy(testWrapper, "preprocessDynamicInput");


        testWrapper.start({input: 10}, {wrapperPayload: 0, payload: 0});   

        expect(preprocessInputSpy.returnValues[0]).to.equal(startSpy.args[0][0]);

    });



});