const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<div className="col-span-1 md:col-span-7 lg:col-span-8 flex flex-col relative min-h-\[50vh\] md:min-h-0 justify-end pb-4 md:pb-6">[\s\S]*?<\/div>\s*<\/div>\s*<div className="col-span-1 md:col-span-5/;

const newBlock = `<div className="col-span-1 md:col-span-7 lg:col-span-8 relative w-full min-h-[450px] md:min-h-[600px] lg:min-h-[700px]">
            
            {/* LIVE Indicator */}
            {isMonitoring && (
              <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-black/60 px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-white border border-white/10 backdrop-blur-md z-30">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-dot rounded-full pulse-dot"></div>
                LIVE
              </div>
            )}

            {/* Master Image */}
            <img 
              src={\`/master_\${masterExpression}.png\`} 
              alt="Master" 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 h-auto max-h-[85%] w-auto object-contain object-bottom pointer-events-none drop-shadow-2xl z-10"
              style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)' }}
            />

            {/* Chat Bubble overlay */}
            <div className="absolute bottom-0 md:bottom-4 left-0 md:left-4 right-0 md:right-4 bg-black/80 backdrop-blur-md border border-gray-600 rounded-xl p-6 md:p-8 shadow-xl z-20">
              <div className="absolute -top-4 left-6 md:left-8 bg-gray-900 border border-gray-600 px-3 py-1 rounded-lg text-accent text-[10px] md:text-xs font-bold">
                マスター
              </div>
              <div className="text-gray-100 text-sm md:text-lg leading-relaxed font-medium min-h-[5rem] md:min-h-[7rem]">
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
