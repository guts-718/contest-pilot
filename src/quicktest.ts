// quickTest.ts
import { runInDocker } from "./executor/dockerRunner";

(async () => {
  const res = await runInDocker(
    `#include <iostream>
using namespace std;
int main(){int x;cin>>x;cout<<2*x<<endl;cout<<"hello_world";while(1){x++;x--;}}`,
    "cpp",
    { timeMs: 2000, memoryMB: 256 },
    "5"
  );

  console.log(res);
})();

// int x;cin>>x;cout<<"hello";cout<<x*2;

/*
infinite loop test:
`#include <iostream>
using namespace std;
int main(){int x;cin>>x;cout<<2*x<<endl;cout<<"hello_world";while(1){x++;x--;}}`


compilation error:
`#include <iostream>
using namespace std;
int main(){cin>>x;cout<<2*x<<endl;}`

segmentation fault:
`#include <iostream>
using namespace std;
int main(){cin>>x;cout<<x/0<<endl;}`


*/