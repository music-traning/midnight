const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const start = code.indexOf('<div className="col-span-1 md:col-span-5');
const end = code.indexOf('</div>\n        </div>\n\n        {/* Bottom Chat Input */}');
console.log(code.substring(start, end));
