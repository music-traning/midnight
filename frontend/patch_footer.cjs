const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `        </div>
      </div>
    </div>
  );
}`;

const footerCode = `        </div>
        
        {/* Footer */}
        <footer className="absolute bottom-1 md:bottom-2 left-1/2 -translate-x-1/2 text-[10px] md:text-xs text-gray-500 hover:text-gray-300 transition-colors z-50">
          <a href="https://note.com/jazzy_begin" target="_blank" rel="noopener noreferrer">
            © 2026 buro
          </a>
        </footer>
      </div>
    </div>
  );
}`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, footerCode);
  fs.writeFileSync('src/App.tsx', code, 'utf8');
  console.log('Footer added successfully');
} else {
  console.log('Could not find the target string');
}
