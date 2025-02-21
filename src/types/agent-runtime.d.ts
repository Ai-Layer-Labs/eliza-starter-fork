// declare module "@elizaos/core" {
//   export interface IAgentRuntime {
//     on?: (event: string, handler: Function) => void;
//     registerAction: (action: Action) => void;
//   }

//   export interface Plugin {
//     initialize(runtime: IAgentRuntime): void;
//   }

//   export interface Action {
//     similes?: string[];
//     description?: string;
//     examples?: any[];
//     handler: Function;
//     validate?: Function;
//   }
// }