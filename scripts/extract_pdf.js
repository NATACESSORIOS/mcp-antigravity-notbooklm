const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

const filePath = process.argv[2];
const outPath = process.argv[3] || path.join(process.cwd(), 'extracted.txt');

if (!filePath) {
    console.error('Usage: node extract_pdf.js <pdf-path> [output-path]');
    console.error('  <pdf-path>    Path to the PDF file to extract text from');
    console.error('  [output-path] Optional output file path (default: ./extracted.txt)');
    process.exit(1);
}

if (!fs.existsSync(filePath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
}

fs.readFile(filePath, (err, dataBuffer) => {
    if (err) {
        console.error('Error reading file:', err.message);
        process.exit(1);
    }
    pdf(dataBuffer).then(function(data) {
        fs.writeFileSync(outPath, data.text);
        console.log(`✅ Text extracted successfully to: ${outPath}`);
        console.log(`   Pages: ${data.numpages} | Characters: ${data.text.length}`);
    }).catch(function(err){
        console.error('Error parsing PDF:', err.message);
        process.exit(1);
    });
});
