const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Fix the left container
const leftOld = 'className="col-span-1 md:col-span-7 lg:col-span-8 relative w-full min-h-[450px] md:min-h-[600px] lg:min-h-[700px]"';
const leftNew = 'className="col-span-1 md:col-span-7 lg:col-span-8 relative w-full h-[450px] md:h-full"';
code = code.replace(leftOld, leftNew);

// 2. Fix the right container wrapper
const rightOld = 'className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col min-h-[400px] md:min-h-0"';
const rightNew = 'className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col min-h-[400px] md:h-full md:min-h-0 md:overflow-hidden"';
code = code.replace(rightOld, rightNew);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('Layout patched for CLS fixed.');
