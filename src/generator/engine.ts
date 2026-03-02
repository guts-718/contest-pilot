import { DSLNode } from "./dslParser";

type Context = {
  values: Record<string, number>;
  output: string[];
};

type Handler = (node: DSLNode, ctx: Context) => void;

const handlers: Record<string, Handler> = {};

export function registerHandler(kind: string, fn: Handler) {
  handlers[kind] = fn;
}

export function generateFromDSL(nodes: DSLNode[]) {
  const ctx: Context = {
    values: {},
    output: []
  };

  for (const node of nodes) {
    const handler = handlers[node.kind];

    if (!handler)
      throw new Error(`No handler registered for: ${node.kind}`);

    handler(node, ctx);
  }

  return ctx.output.join("\n");
}