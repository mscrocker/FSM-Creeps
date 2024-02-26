
/**
 * Interface defining the shape of the memory used by a wrapper node.
 * @typeParam WrappedMemory The type of the memory used by the wrapped node.
 * @typeParam WrapperMemory The type of the memory used by the wrapper.
 */
export interface WrapperMemoryContainer<WrappedMemory, WrapperMemory> {

    /**
     * The memory of the wrapped node.
     */
    wrappedMemory: WrappedMemory;

    /**
     * The memory of the wrapper.
     */
    wrapperMemory: WrapperMemory;
}