const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(`              </div>\n            </div>\n          </div>\n\n          <div className="col-span-1 md:col-span-5`, `              </div>\n            </div>\n\n          <div className="col-span-1 md:col-span-5`);
fs.writeFileSync('src/App.tsx', code, 'utf8');
