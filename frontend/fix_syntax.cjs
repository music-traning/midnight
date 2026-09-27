const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
const searchStr = `            </div>
          </div>
            <div className="bg-panel backdrop-blur-md`; // because the outer div was removed

code = code.replace(
  `            </div>\n          </div>\n            <div className="bg-panel backdrop-blur-md`,
  `            </div>\n          </div>\n\n          <div className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col min-h-[400px] md:h-full md:min-h-0 md:overflow-hidden">\n            <div className="bg-panel backdrop-blur-md`
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
