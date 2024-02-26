import { createLeafTaskBuilder } from '../../../src/nodes/BaseNode';
import { createSwitchBuilder } from '../../../src/nodes/switch/SwitchNode';
import { expect } from 'chai';
import * as Sinon from 'sinon';
import { NodeContextImpl } from '../../../src/nodes/NodeContext';


const createSwitch = createSwitchBuilder({switchPayload: ""})

const TestNode = createLeafTaskBuilder({x: 3})(() => {
    if (3>2){
        return {
            key: "TestAWithArgs",
            args: 3
        }
    }
    return "TestA"
})

const TestNode2 = createLeafTaskBuilder({y: "hello"})({
    start(args: number){return {}},
    loop() {
        return "TestB"
    }
})

const TestSwitchBuilder = createSwitch(() => {
    if (3>2) {
        return "SwitchKeyB"
    }
    return "SwitchKeyA"
})

describe("Switch node tests", () => {

    let testNode1 = new TestNode()
    let testNode2 = new TestNode2()
    let testSwitch = TestSwitchBuilder({
        SwitchKeyA: testNode1,
        SwitchKeyB: testNode2
    })

    beforeEach(() => {
        testNode1 = new TestNode()
        testNode2 = new TestNode2()
        testSwitch = TestSwitchBuilder({
            SwitchKeyA: testNode1,
            SwitchKeyB: testNode2
        })
    })

    it("Should run the loop of the contained element", () => {

        const testNode2Spy = Sinon.spy(testNode2, "loop")
        const memory = testSwitch.start(0, {x: 3, y: "2", switchPayload: ""})
        testSwitch.loop(new NodeContextImpl({x:0, y: "", switchPayload: ""}, []), memory)
        expect(testNode2Spy.calledOnce).to.be.true

    })
})