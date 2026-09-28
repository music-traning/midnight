const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Change <div className="max-w-7xl... to <main
const mainDivOpen = 'className="max-w-7xl mx-auto w-full px-2 md:px-4 py-2 md:py-4 flex flex-col flex-1 relative z-10 h-auto md:h-full"';
code = code.replace(
  `<div ${mainDivOpen}>`,
  `<main ${mainDivOpen}>`
);

// We need to replace the closing </div> of this main container.
// It's located right before {/* Help Modal */}
code = code.replace(
  `      {/* Help Modal */}`,
  `      </main>\n      {/* Help Modal */}`
);
// But we must remove the original closing </div>
// Let's do it carefully:
//        </footer>
//      </div>
//      {/* Help Modal */}
code = code.replace(
  `        </footer>\n      </div>\n      {/* Help Modal */}`,
  `        </footer>\n      </main>\n      {/* Help Modal */}`
);

// 2. Add htmlFor and id to Right Panel inputs
code = code.replace(
  '<label className="text-[10px] md:text-xs text-gray-400">{T.keySetting}</label>',
  '<label htmlFor="key-select" className="text-[10px] md:text-xs text-gray-400">{T.keySetting}</label>'
);
code = code.replace(
  '<select \n                  value={musicKey}',
  '<select id="key-select"\n                  value={musicKey}'
);

code = code.replace(
  '<label className="text-[10px] md:text-xs text-gray-400">{T.inputDevice}</label>',
  '<label htmlFor="device-select" className="text-[10px] md:text-xs text-gray-400">{T.inputDevice}</label>'
);
code = code.replace(
  '<select \n                  value={selectedDeviceId}',
  '<select id="device-select"\n                  value={selectedDeviceId}'
);

code = code.replace(
  '<label className="text-[10px] md:text-xs text-gray-400">{T.latencyCalib}</label>',
  '<label htmlFor="latency-input" className="text-[10px] md:text-xs text-gray-400">{T.latencyCalib}</label>'
);
code = code.replace(
  '<input type="text" value={latency',
  '<input id="latency-input" type="text" value={latency'
);

code = code.replace(
  '<label className="text-[10px] md:text-xs text-gray-400">{T.metronome}</label>',
  '<label htmlFor="metronome-select" className="text-[10px] md:text-xs text-gray-400">{T.metronome}</label>'
);
code = code.replace(
  '<select \n                  value={metronomeMode}',
  '<select id="metronome-select"\n                  value={metronomeMode}'
);

// 3. Add aria-label to buttons
// Help Button in Header
code = code.replace(
  'title="ヘルプ"\n          >',
  'title="ヘルプ"\n            aria-label="ヘルプを開く"\n          >'
);

// Help Modal Close Button
code = code.replace(
  'className="absolute top-4 right-4 text-gray-500 hover:text-accent transition-colors"\n            >',
  'className="absolute top-4 right-4 text-gray-500 hover:text-accent transition-colors"\n              aria-label="ヘルプを閉じる"\n            >'
);

// Chat Send Button
code = code.replace(
  '<button onClick={handleChat}',
  '<button onClick={handleChat} aria-label="メッセージを送信"'
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx patched for Accessibility');
