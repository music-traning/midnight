const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="col-span-1 md:col-span-7 lg:col-span-8 flex flex-col">[\s\S]*?<\/div>\s*<\/div>\s*<div className="col-span-1 md:col-span-5/;

const newBlock = `<div className="col-span-1 md:col-span-7 lg:col-span-8 flex flex-col relative min-h-[50vh] md:min-h-0 justify-end pb-4 md:pb-6">
            
            {/* LIVE Indicator */}
            {isMonitoring && (
              <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-black/60 px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-white border border-white/10 backdrop-blur-md z-30">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-dot rounded-full pulse-dot"></div>
                LIVE
              </div>
            )}

            {/* Master Image Wrapper */}
            <div className="absolute inset-0 flex items-end justify-center pointer-events-none z-10 pb-[100px] md:pb-[140px] lg:pb-[150px]">
              <img 
                src={\`/master_\${masterExpression}.png\`} 
                alt="Master" 
                className="h-[80%] md:h-[90%] lg:h-[95%] object-contain drop-shadow-2xl" 
              />
            </div>

            {/* Chat Bubble overlay */}
            <div className="relative mt-auto w-full bg-black/80 backdrop-blur-md border border-gray-600 rounded-xl p-4 md:p-6 shadow-xl z-20">
              <div className="absolute -top-3 left-4 md:left-6 bg-gray-900 border border-gray-600 px-2 py-0.5 md:px-3 md:py-0.5 rounded-lg text-accent text-[10px] md:text-xs font-bold">
                マスター
              </div>
              <div className="text-gray-100 text-sm md:text-lg leading-relaxed font-medium min-h-[4rem]">
                {masterMsg.split('\\n').map((line, i) => (
                  <span key={i}>{line}<br/></span>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-5`;

if (regex.test(code)) {
  code = code.replace(regex, newBlock);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Successfully replaced block.');
} else {
  console.log('Could not find regex match.');
}
