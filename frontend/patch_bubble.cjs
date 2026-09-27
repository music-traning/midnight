const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldBlockStart = code.indexOf('<img \n              src={`/master_${currentEval?.expression || \'neutral\'}.png`}');
const oldBlockEndStr = '</div>\n          </div>\n\n          <div className="col-span-1 md:col-span-5';
const oldBlockEnd = code.indexOf(oldBlockEndStr);

if (oldBlockStart === -1 || oldBlockEnd === -1) {
  console.error("Could not find the block to replace.");
  process.exit(1);
}

const oldBlock = code.substring(oldBlockStart, oldBlockEnd + 6); // include '</div>'

const newBlock = `{/* Master Image & Chat Bubble Wrapper */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-[85%] max-w-3xl flex justify-center items-end">
              <div className="relative h-full w-full flex justify-center">
                <img 
                  src={\`/master_\${currentEval?.expression || 'neutral'}.png\`} 
                  alt="Master" 
                  className="h-full w-auto object-contain z-10 drop-shadow-2xl pointer-events-none"
                />

                {/* Chat Bubble overlay */}
                <div 
                  className={\`absolute bottom-4 md:bottom-12 left-1/2 -translate-x-1/2 w-[95%] md:w-11/12 bg-black/80 backdrop-blur-md border border-gray-600 rounded-xl p-6 md:p-8 shadow-xl z-20 \${
                    hasMoreEvaluations ? 'cursor-pointer hover:bg-black/90 transition-colors' : ''
                  }\`}
                  onClick={handleBubbleClick}
                >
                  <div className="absolute -top-4 left-6 md:left-8 bg-gray-900 border border-gray-600 px-3 py-1 rounded-lg text-accent text-[10px] md:text-xs font-bold">
                    マスター
                  </div>
                  <div className="text-gray-100 text-sm md:text-lg leading-relaxed font-medium min-h-[5rem] md:min-h-[7rem] whitespace-pre-wrap select-none">
                    {displayedMsg.split(/\\\\n|\\n/).map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                  
                  {/* ▼ Tap to Continue Indicator */}
                  {hasMoreEvaluations && (
                    <div className="absolute bottom-4 right-6 text-accent animate-bounce text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] select-none pointer-events-none">
                      ▼
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>`;

code = code.replace(oldBlock, newBlock);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Chat bubble wrapper applied successfully.");
