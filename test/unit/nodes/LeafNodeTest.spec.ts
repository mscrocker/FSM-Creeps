import { expect } from 'chai';
import { createLeafTaskBuilder } from '../../../src/nodes/BaseNode';
import { NodeContextImpl } from '../../../src/nodes/NodeContext';
import { AnyNode } from '../../../src/nodes/AnyNode';
import { NodeContext } from '../../../build/nodes/NodeContext';
import { BaseSlotKeyType } from '../../../src/nodes/SlotTypes';
import { BasePayloadType } from '../../../src/nodes/PayloadTypes';


const createLeafTask = createLeafTaskBuilder({payloadKey: ""})

const ClassTestTask = createLeafTask({

    create(){
        return {
            stateKey: "StateValue"
        }
    },

    start(args: string, constantState) {
        return {
            memoryKey: args,
            memoryKey2: constantState
        }
    },

    loop({context, memory}) {
        if (memory.memoryKey == "FireA"){
            if (context.slotIsEnabled("A")){
                return {
                    key: "A",
                    args: 2
                }
            }
        }
    },

    abort(_reason, memory, _payload){
        memory.memoryKey == "AbortCompleted"
    }
})

const FunctionalTestTask = createLeafTask(({memory, context}: {memory: {memoryKey: string}, context: NodeContext<BaseSlotKeyType, BasePayloadType>}) => {
    if (memory.memoryKey == "FireA"){
        if (context.slotIsEnabled("A")){
            return {
                key: "A",
                args: 2
            }
        }
    }
})

const testCases = {

    firingTransition: (testTask: AnyNode) => (() => {
        testTask.start("StartArgs", {})
        const result = testTask.loop(
            new NodeContextImpl(
                {
                    payloadKey: "PayloadValue"
                }, 
                [
                    {
                        graphName: "TestGraph",
                        nodeName: "TestNode",
                        registeredSlots: ["A"]
                    }
                ]
            ),
            {
                memoryKey: "FireA", 
                memoryKey2: { 
                    stateKey: "A"
                }
            }
        );
        expect(result).to.be.an("object").to.include({key: "A"})
    }),

    doNotFireTransitionWhenNotRegistered: (testTask: AnyNode) => (() => {
        testTask.start("StartArgs", {})
        const result = testTask.loop(
            new NodeContextImpl(
                {
                    payloadKey: "PayloadValue"
                }, 
                [
                    {
                        graphName: "TestGraph",
                        nodeName: "TestNode",
                        registeredSlots: []
                    }
                ]
            ),
            {
                memoryKey: "FireA", 
                memoryKey2: { 
                    stateKey: "A"
                }
            }
        );
        expect(result).to.be.undefined
    }),

    doNotFireTransitionWhenModelDoesNotRequireIt: (testTask: AnyNode) => (() => {
        testTask.start("StartArgs", {})
        const result = testTask.loop(
            new NodeContextImpl(
                {
                    payloadKey: "PayloadValue"
                }, 
                [
                    {
                        graphName: "TestGraph",
                        nodeName: "TestNode",
                        registeredSlots: ["A"]
                    }
                ]
            ),
            {
                memoryKey: "DoNotFireA", 
                memoryKey2: { 
                    stateKey: "A"
                }
            }
        );
        expect(result).to.be.undefined
    })
    
}


describe("Leaf node tests", () => {
    describe("Class implementations", () => {

        let testTask = new ClassTestTask();
    
        beforeEach(() => {
            testTask = new ClassTestTask();
        });
    
        it("Should fire a transition when called with the adequate parameters", testCases.firingTransition(testTask));
    
        it("Should not fire a transition when this transition is not registered", testCases.doNotFireTransitionWhenNotRegistered(testTask));
    
        it("Should not fire a transition when the model logic does not indicate so.", testCases.doNotFireTransitionWhenModelDoesNotRequireIt(testTask));
    })
    
    describe("Functional implementation", () => {
    
        let testTask = new FunctionalTestTask();
    
        beforeEach(() => {
            testTask = new FunctionalTestTask();
        });
    
        it("Should fire a transition when called with the adequate parameters", testCases.firingTransition(testTask));
    
        it("Should not fire a transition when this transition is not registered", testCases.doNotFireTransitionWhenNotRegistered(testTask));
    
        it("Should not fire a transition when the model logic does not indicate so.", testCases.doNotFireTransitionWhenModelDoesNotRequireIt(testTask));
    })
})
