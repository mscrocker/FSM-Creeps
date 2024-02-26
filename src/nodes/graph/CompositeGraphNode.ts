import { NodeLoopReturnType } from "nodes/BaseNode";
import { BaseSlotKeyType, BaseSlotArgsType, BaseSlotType, ExtractSlotKeyTypeFromSlot } from '../SlotTypes';
import { BaseInputType } from '../InputTypes';
import { BasePayloadType } from '../PayloadTypes';
import { BaseNode } from '../BaseNode';
import { NodeAbortReason } from "nodes/NodeAbortReason";
import { NodeContext } from "nodes/NodeContext";



export function composeNodes<SlotType extends BaseSlotType<BaseSlotKeyType, BaseSlotArgsType>, InputType extends BaseInputType, PayloadType extends BasePayloadType, MemoryType extends {}, ArgsType extends unknown[]>
    (fun: (...args: ArgsType) => BaseNode<SlotType, InputType, PayloadType, MemoryType>): (new (...args: ArgsType) => BaseNode<SlotType, InputType, PayloadType, MemoryType>) {


    class Aux extends BaseNode<SlotType, InputType, PayloadType, MemoryType> {
        
        private callbackNode: BaseNode<SlotType, InputType, PayloadType, MemoryType>;

        public constructor(...args: ArgsType){
            super();
            this.callbackNode = fun(...args);
        }

        start(args: InputType, payload: PayloadType): MemoryType {
            return this.callbackNode.start(args, payload);
        }

        loop(context: NodeContext<ExtractSlotKeyTypeFromSlot<SlotType>, PayloadType>, memory: MemoryType): NodeLoopReturnType<SlotType> {
            return this.callbackNode.loop(context, memory);
        }

        abort(reason: NodeAbortReason, memory: MemoryType, payload: PayloadType): void {
            return this.callbackNode.abort(reason, memory, payload);
        }
        
    }

    return Aux

}

