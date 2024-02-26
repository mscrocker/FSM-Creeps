import { ExtractSlotKeyTypeFromSlot } from '../SlotTypes';
import { BaseNode, createLeafTaskBuilder, NodeLoopReturnType } from '../BaseNode';
import { BaseInputType } from '../InputTypes';
import { BasePayloadType } from '../PayloadTypes';
import { NodeAbortReason } from 'nodes/NodeAbortReason';
import { NodeContext } from 'nodes/NodeContext';


export type BaseSwitchKeyType = string

type ComputeNode<T> = T extends Record<any, infer NodeType> ? NodeType : never;

type PayloadUnionToIntersection<U> = 
  (U extends any ? (k: U)=>void : never) extends ((k: infer I extends BasePayloadType)=>void) ? I : never
type ComputePayload<T> = PayloadUnionToIntersection<T extends BaseNode<any, any, infer PayloadType, any> ? PayloadType : never>; 

type ComputeSlotType<T> = T extends BaseNode<infer SlotType, any, any, any> ? SlotType : never;

type PreComputeInputType<T> = T extends BaseNode<any, infer InputType, any, any> ? (unknown extends InputType ? never: InputType) : never;
type ComputeInputType<T> = PreComputeInputType<T> extends never ? unknown : PreComputeInputType<T>;


type MemorySwitchType<SwitchKeyType extends BaseSwitchKeyType, InputType extends BaseInputType> = {

    currentNodeKey: SwitchKeyType;
    currentNodeMemory: any;
    startArgs: InputType;

}

export function createSwitchBuilder<SwitchPayloadType extends BasePayloadType>(_payload: SwitchPayloadType) {

    return <SwitchKeyType extends BaseSwitchKeyType, CreateArgsType extends unknown[]>(director: (payload: SwitchPayloadType, ...args: CreateArgsType) => SwitchKeyType) => {

        return <T extends Record<SwitchKeyType, unknown>>(switchMap: T, ...args: CreateArgsType) => {

            class Aux extends BaseNode<ComputeSlotType<ComputeNode<T>>, ComputeInputType<ComputeNode<T>>, SwitchPayloadType & ComputePayload<ComputeNode<T>>, MemorySwitchType<SwitchKeyType, ComputeInputType<ComputeNode<T>>>> {
                
                private createArgs: CreateArgsType;

                constructor(...args: CreateArgsType) {
                    super()
                    this.createArgs = args
                }

                start(args: ComputeInputType<ComputeNode<T>>, payload: SwitchPayloadType & ComputePayload<ComputeNode<T>>): MemorySwitchType<SwitchKeyType, ComputeInputType<ComputeNode<T>>> {
                    
                    const currentNodeKey = director(payload, ...this.createArgs)

                    const memory = {
                        currentNodeKey,
                        currentNodeMemory: (switchMap[currentNodeKey] as any).start(args, payload),
                        startArgs: args
                    }

                    return memory

                }

                loop(context: NodeContext<ExtractSlotKeyTypeFromSlot<ComputeSlotType<ComputeNode<T>>>, SwitchPayloadType & ComputePayload<ComputeNode<T>>>,
                    memory: MemorySwitchType<SwitchKeyType, ComputeInputType<ComputeNode<T>>>): NodeLoopReturnType<ComputeSlotType<ComputeNode<T>>> {

                    const newNodeKey = director(context.getPayload(), ...this.createArgs)
                    if (newNodeKey != memory.currentNodeKey) {
                        (switchMap[memory.currentNodeKey] as any).abort("AbortedBySwitch", memory.currentNodeMemory, context.getPayload())
                        memory.currentNodeKey = newNodeKey
                        memory.currentNodeMemory = (switchMap[memory.currentNodeKey] as any).start(memory.startArgs, context.getPayload())
                    }
                    return (switchMap[memory.currentNodeKey] as any).loop(context, memory.currentNodeMemory)

                }

                abort(reason: NodeAbortReason, memory: MemorySwitchType<SwitchKeyType, ComputeInputType<ComputeNode<T>>>, payload: PayloadUnionToIntersection<ComputeNode<T> extends BaseNode<any, any, infer PayloadType extends BasePayloadType, any> ? PayloadType : never>): void {
                    
                    (switchMap[memory.currentNodeKey] as any).abort(reason, memory.currentNodeMemory, payload)

                }

            }

            return new Aux(...args) as BaseNode<ComputeSlotType<ComputeNode<T>>, ComputeInputType<ComputeNode<T>>, SwitchPayloadType & ComputePayload<ComputeNode<T>>, MemorySwitchType<SwitchKeyType, ComputeInputType<ComputeNode<T>>>>

        }

    }
}
