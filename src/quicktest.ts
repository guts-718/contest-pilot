// quickTest.ts
import { runInDocker } from "./executor/dockerRunner";

(async () => {
  const res = await runInDocker(
    `#include <iostream>
using namespace std;
int main(){cout<<"hello_world";}`,
    "cpp",
    { timeMs: 2000, memoryMB: 256 },
    "5"
  );

  console.log(res);
})();

// int x;cin>>x;cout<<"hello";cout<<x*2;