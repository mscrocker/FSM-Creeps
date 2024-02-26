
type ErrorBrand<Err extends string> = Err

namespace ErrorMessages {

    export type NodeKeyDuplicatedError = "The node key is duplicated!";
    export type TransitionKeyDuplicatedError = ErrorBrand<"The transition key is duplicated!">;
    export type TransitionSlotKeyDuplicatedError = ErrorBrand<"There is already a transition registered into this slot!">;
    export type GraphSlotKeyDuplicatedError = ErrorBrand<"The slot key is duplicated!">;

    export type FunctionSourceArgumentsDoNotMatchExpected = ErrorBrand<"The function parameters do not match the source arguments of the node!">;
    export type FunctionReturnTypeDoNotMatchExcepted = ErrorBrand<"The function return type does not match the destination parameters type!">;

    export type WrapperSlotsDuplicated = ErrorBrand<"The wrapper slots cannot be the same as the node slots!">;

}

export {ErrorMessages}