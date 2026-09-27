const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /{/\* Master Image \*/}\s*<img\s*src={\\\`/master_\\\${masterExpression}\.png\\\`}\s*alt="Master"\s*className="absolute bottom-0 left-1\/2 -translate-x-1\/2 h-auto max-h-\[85%\] w-auto object-contain object-bottom pointer-events-none drop-shadow-2xl z-10"\s*style={{ WebkitMaskImage: 'linear-gradient\(to bottom, black 70%, transparent 100%\)', maskImage: 'linear-gradient\(to bottom, black 70%, transparent 100%\)' }}\s*\/>/;

const newBlock = `{/* Master Image */}
            <img 
              src={\`/master_\${masterExpression}.png\`} 
              alt="Master" 
              className="absolute left-1/2 -translate-x-1/2 bottom-[120px] md:bottom-[190px] h-auto max-h-[70%] md:max-h-[85%] w-auto object-contain z-10 drop-shadow-2xl pointer-events-none"
            />`;

if (regex.test(code)) {
  code = code.replace(regex, newBlock);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Successfully replaced block.');
} else {
  console.log('Could not find regex match.');
}
