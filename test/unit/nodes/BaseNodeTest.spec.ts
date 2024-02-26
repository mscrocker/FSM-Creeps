import { expect } from 'chai';
import { BaseNode, NodeLoopReturnType } from '../../../src/nodes/BaseNode.js';
import { NodeAbortReason } from '../../../src/nodes/NodeAbortReason.js';
import { NodeContext } from '../../../src/nodes/NodeContext.js';
import { BaseSlotType, ExtractSlotKeyTypeFromSlot } from '../../../src/nodes/SlotTypes.js';


type MockNodeSlots = 
    BaseSlotType<"MockTransitionA"> |
    BaseSlotType<"MockTransitionB", {slotArg: number}>;

type MockNodeInput = {input: number};

type MockNodePayload = {payload: number};

type MockNodeMemory = {memory: number};

class MockNode extends BaseNode<MockNodeSlots, MockNodeInput, MockNodePayload, MockNodeMemory> {
    
    start(args: MockNodeInput): MockNodeMemory {
        return { memory: args.input+1 };
    }

    loop(context: NodeContext<ExtractSlotKeyTypeFromSlot<MockNodeSlots>, MockNodePayload>, memory: MockNodeMemory): NodeLoopReturnType<MockNodeSlots> {
        
    }

    abort(reason: NodeAbortReason, memory: MockNodeMemory): void {
        throw new Error('Method not implemented.');
    }

};



describe("BaseNode tests", () => {

    it("Should return the initial memory value", () => {

        const mockNode = new MockNode();

        expect(mockNode.start({input: 1})).to.be.an("object").to.have.property("memory").to.equal(2);


    });


});