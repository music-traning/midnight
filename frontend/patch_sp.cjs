const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Root wrapper
code = code.replace(
  'className="h-[100dvh] bg-bg-dark text-gray-200 font-sans flex flex-col relative overflow-hidden"',
  'className="min-h-[100dvh] h-auto md:h-[100dvh] bg-bg-dark text-gray-200 font-sans flex flex-col relative overflow-x-hidden overflow-y-auto md:overflow-hidden"'
);

// 2. Inner wrapper
code = code.replace(
  'className="max-w-7xl mx-auto w-full px-2 md:px-4 py-2 md:py-4 flex flex-col flex-1 relative z-10 h-full"',
  'className="max-w-7xl mx-auto w-full px-2 md:px-4 py-2 md:py-4 flex flex-col flex-1 relative z-10 h-auto md:h-full"'
);

// 3. Left Column (Master Image)
code = code.replace(
  'className="col-span-1 md:col-span-7 lg:col-span-8 relative w-full h-[450px] md:h-full"',
  'className="col-span-1 md:col-span-7 lg:col-span-8 relative w-full h-[400px] min-h-[350px] md:h-full"'
);

// 4. Footer
code = code.replace(
  '<footer className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 text-[10px] md:text-xs text-gray-500 hover:text-gray-300 transition-colors z-50">',
  '<footer className="mt-4 mb-2 text-center md:absolute md:bottom-2 md:left-1/2 md:-translate-x-1/2 md:mt-0 md:mb-0 text-[10px] md:text-xs text-gray-500 hover:text-gray-300 transition-colors z-50 w-full md:w-auto">'
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx patched for responsive layout');
