import { parseDSL } from "../generator/dslParser";
import { runStress } from "../stress/stressRunner";

(async () => {
  const code = `
#include <bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin>>n;
    vector<int>a(n);
    for(int i=0;i<n;i++) cin>>a[i];
    long long s=0;
    for(int x:a) s+=x;
    cout<<s;
}
`;

  const spec = `
n: int[1,100]
arr: array[n] int[1,1000]
`;

  const ast = parseDSL(spec);

  if (ast.errors.length) {
    console.log("DSL Errors:", ast.errors);
    return;
  }

  const result = await runStress(
    code,
    "cpp",
    { timeMs: 2000, memoryMB: 256 },
    ast.nodes
  );

  console.log(result);
})();