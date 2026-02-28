// npx ts-node .\src\Test\C_diff_test.ts
import { parseDSL } from "../generator/dslParser";
import { runDifferentialTest } from "../correctness/diffTester";

(async () => {
  const solution = `
#include <bits/stdc++.h>
using namespace std;
int main(){int x;cin>>x;cout<<x*2;}
`;

  const brute = `
#include <bits/stdc++.h>
using namespace std;
int main(){int x;cin>>x;cout<<x*2;}
`;

  const spec = `x: int[1,10]`;
  const ast = parseDSL(spec);

  const result = await runDifferentialTest(
    solution,
    brute,
    "cpp",
    { timeMs: 2000, memoryMB: 256 },
    ast.nodes
  );

  console.log(result);
})();