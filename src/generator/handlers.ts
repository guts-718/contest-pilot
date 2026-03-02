import { registerHandler } from "./engine";

// utility
function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// int
registerHandler("int", (node, ctx) => {
  const min = Number(node.params[0]);
  const max = Number(node.params[1]);

  const v = randInt(min, max);
  ctx.values[node.name] = v;
  ctx.output.push(String(v));
});


// helpers 
function parseRange(str: string) {
  const m = str.match(/int\[(.*?),(.*?)\]/);
  if (!m) throw new Error("Invalid range: " + str);
  return [Number(m[1]), Number(m[2])];
}

function shuffle(arr: number[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// array
registerHandler("array", (node, ctx) => {
  const size = ctx.values[node.params[0]];
  const [min, max] = parseRange(node.meta?.extra);

  const arr = Array.from({ length: size }, () =>
    randInt(min, max)
  );

  ctx.output.push(arr.join(" "));
});


// distinct
registerHandler("distinct", (node, ctx) => {
  const size = ctx.values[node.params[0]];
  const [min, max] = parseRange(node.meta?.extra);

  if (max - min + 1 < size)
    throw new Error("Range too small for distinct array");

  const pool = Array.from(
    { length: max - min + 1 },
    (_, i) => i + min
  );

  shuffle(pool);

  ctx.output.push(pool.slice(0, size).join(" "));
});


// perm
registerHandler("permutation", (node, ctx) => {
  const size = ctx.values[node.params[0]];

  const arr = Array.from({ length: size }, (_, i) => i + 1);

  shuffle(arr);

  ctx.output.push(arr.join(" "));
});


// sorted
registerHandler("sorted", (node, ctx) => {
  const size = ctx.values[node.params[0]];
  const [min, max] = parseRange(node.meta?.extra);

  const arr = Array.from({ length: size }, () =>
    randInt(min, max)
  ).sort((a, b) => a - b);

  ctx.output.push(arr.join(" "));
});


// rev_sorted
registerHandler("revsorted", (node, ctx) => {
  const size = ctx.values[node.params[0]];
  const [min, max] = parseRange(node.meta?.extra);

  const arr = Array.from({ length: size }, () =>
    randInt(min, max)
  ).sort((a, b) => b - a);

  ctx.output.push(arr.join(" "));
});

// string
registerHandler("string", (node, ctx) => {
  const size = ctx.values[node.params[0]];
  const mode = node.meta?.extra || "lowercase";

  let chars = "abcdefghijklmnopqrstuvwxyz";
  if (mode.includes("uppercase")) chars = chars.toUpperCase();
  if (mode.includes("digits")) chars = "0123456789";

  let s = "";
  for (let i = 0; i < size; i++)
    s += chars[Math.floor(Math.random() * chars.length)];

  ctx.output.push(s);
});


// binary
registerHandler("binary", (node, ctx) => {
  const size = ctx.values[node.params[0]];

  let s = "";
  for (let i = 0; i < size; i++)
    s += Math.random() < 0.5 ? "0" : "1";

  ctx.output.push(s);
});


// matrix
registerHandler("matrix", (node, ctx) => {
  const rows = ctx.values[node.params[0]];
  const cols = ctx.values[node.params[1]];
  const [min, max] = parseRange(node.meta?.extra);

  for (let r = 0; r < rows; r++) {
    const row = Array.from({ length: cols }, () =>
      randInt(min, max)
    );
    ctx.output.push(row.join(" "));
  }
});


// tree
registerHandler("tree", (node, ctx) => {
  const n = ctx.values[node.params[0]];

  for (let i = 2; i <= n; i++) {
    const parent = randInt(1, i - 1);
    ctx.output.push(`${parent} ${i}`);
  }
});


// graph
registerHandler("graph", (node, ctx) => {
  const n = ctx.values[node.params[0]];
  const m = ctx.values[node.params[1]];
  const directed = node.meta?.extra?.includes("directed");

  const edges = new Set<string>();

  while (edges.size < m) {
    const u = randInt(1, n);
    const v = randInt(1, n);
    if (u === v) continue;

    const key = directed ? `${u},${v}` :
      [u, v].sort().join(",");

    edges.add(key);
  }

  for (const e of edges) {
    const [u, v] = e.split(",");
    ctx.output.push(`${u} ${v}`);
  }
});