import { createLeafTaskBuilder } from '../../../src/nodes/BaseNode';
import { createWrapperBuilder } from '../../../src/nodes/wrapper/NodeWrapper';
import { setupGraph } from '../../../src/nodes/graph/GraphNode';
import { composeNodes } from '../../../src/nodes/graph/CompositeGraphNode';
import { AnyNode } from '../../../src/nodes/AnyNode';
import * as Sinon from 'sinon';
import { expect } from 'chai';
import { NodeContextImpl } from '../../../src/nodes/NodeContext';


const customBuilder = createLeafTaskBuilder({creepId: ""})
const customWrapperBuilder = createWrapperBuilder({creepId: ""})




describe("Composite graph tests", () => {

    const AttachableTask = customBuilder(() => {
        if (0>2){
            return "CONDITION_1";
        }
        if (0>3){
            return "CONDITION_2"
        }
    });

    const AttachedTask = customBuilder(() => {
        if (0 > 1){
            return "CONDITION_4"
        }
    });
    
    const AttachableGuard = customWrapperBuilder(() => {
        if (0>3){
            return "CONDITION_3"
        }
    });
    
    
    const AttachableSubGraph = setupGraph("RenewingGraph", (builder, subGraph: AnyNode) => {
        
        return builder
            .addNode("Working", new AttachableGuard(subGraph))
            .addNode("Renewing", attachableTask)
            .addSlot("A")
            .addInternalTransition("StartRenewing", "Working", "CONDITION_3", "Renewing")
            .addInternalTransition("FinishRenewing", "Renewing", "CONDITION_1", "Working")
            .done("Working", () => {})
    
    });
    
    const AttachedSubGraph = setupGraph("WorkingGraph", (builder) => builder
    
        .addNode("A", attachedTask)
        .addNode("B", attachedTask)
        .addInternalTransition("A2B", "A", "CONDITION_4", "B")
        .addInternalTransition("B2A", "B", "CONDITION_4", "A")
        .done("A", () => {})
    
    );
    
    
    const AttachedGraph = composeNodes(() => {
        return new AttachableSubGraph(new AttachedSubGraph());
    });

    let attachedTask = new AttachedTask();
    let attachableTask = new AttachableTask(); 
    let attachedGraph = new AttachedGraph();


    beforeEach(() => {
        attachedTask = new AttachedTask()
        attachableTask = new AttachableTask()
        attachedGraph = new AttachedGraph()
    });

    describe("loop", () => {
        it("Should run the attached method", () => {
            const attachedTaskSpy = Sinon.spy(attachedTask, "loop");
            const memory = attachedGraph.start({}, {});
            attachedGraph.loop(new NodeContextImpl({}, []), memory);
            expect(attachedTaskSpy.calledOnce).to.equal(true);
        });
    
        it("Should run the attachable method", () => {
            const attachedTaskSpy = Sinon.spy(attachableTask, "loop");
            attachedGraph.loop(new NodeContextImpl({}, []), {currentNode: "Renewing", currentNodeMemory: attachableTask.start({}, {creepId: "2"})});
            expect(attachedTaskSpy.calledOnce).to.equal(true);
        });
    
    });

    describe("start", () => {
        it("Should run the attached method", () => {
            const attachedTaskSpy = Sinon.spy(attachedTask, "start");
            attachedGraph.start({}, {});
            expect(attachedTaskSpy.calledOnce).to.equal(true);
        });
    
    });

    describe("abort", () => {
        it("Should run the attached method", () => {
            const attachedTaskSpy = Sinon.spy(attachedTask, "abort");
            const memory = attachedGraph.start({}, {});
            attachedGraph.abort("AbortedByWrapper", memory, {});
            expect(attachedTaskSpy.calledOnce).to.equal(true);
        });
    
    })

})