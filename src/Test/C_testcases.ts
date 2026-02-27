// C_test_case_validations: npx ts-node src/Test/C_testcases.ts
import { runSampleTests } from "../executor/testRunner";

(async () => {
  const results = await runSampleTests(
    `#include <iostream>
using namespace std;
int main(){int x;cin>>x;cout<<x*2;}`,
    "cpp",
    { timeMs: 2000, memoryMB: 256 },
    [
      { input: "5", output: "10" },
      { input: "3", output: "6" },
      { input: "2", output: "5" }
    ]
  );

  console.log(results);
})();