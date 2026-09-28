const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// There is currently:
//         </footer>
//       </div>
//
//       </main>
//       {/* Help Modal */}

code = code.replace(
  '        </footer>\n      </div>\n\n      </main>\n      {/* Help Modal */}',
  '        </footer>\n      </main>\n      {/* Help Modal */}'
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
