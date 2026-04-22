const fs = require('fs');
const path = require('path');

const inputPath = `C:\\Users\\gilbe\\.gemini\\antigravity\\brain\\98be9ef3-5d21-48c8-a3ea-1f48f8d5764e\\.system_generated\\steps\\35\\output.txt`;
const targetDir = `G:\\Meu Drive\\ARMAZENAMENTO TOTAL (2025)\\MCP NOTBOOKLM - ANTIGRAVITY`;

const text = fs.readFileSync(inputPath, 'utf8');
const lines = text.split('\n');

const notebooks = [];
for (let line of lines) {
    if (line.startsWith('- **')) {
        let name = line.substring(4, line.indexOf('** |'));
        notebooks.push(name);
    }
}

console.log(`Found ${notebooks.length} notebooks.`);

if (!fs.existsSync(targetDir)) {
    console.log("Creating target directory: " + targetDir);
    fs.mkdirSync(targetDir, { recursive: true });
}

notebooks.forEach(name => {
    // Sanitização para remover caracteres não permitidos no Windows: \ / : * ? " < > |
    let safeName = name.replace(/[:]/g, ' -').replace(/[\/\\?*|"<>]/g, '-').trim();
    const folderPath = path.join(targetDir, safeName);
    
    if (!fs.existsSync(folderPath)) {
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            console.log("Created:", safeName);
        } catch (err) {
            console.error("Failed to create:", safeName, err.message);
        }
    } else {
        console.log("Already exists:", safeName);
    }
});
