const fs = require('fs');
const path = require('path');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

async function createDocx(markdownText, outputPath) {
    const lines = markdownText.split('\n');
    const children = [];

    let currentListLevel = -1;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trimEnd();

        if (line === '' || line.startsWith('---')) {
            continue; // Ignore separator lines and empty lines for now (or add spacing)
        }

        // Headings
        if (line.startsWith('# ')) {
            children.push(new Paragraph({
                text: line.replace('# ', ''),
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 }
            }));
            continue;
        }
        if (line.startsWith('## ')) {
            children.push(new Paragraph({
                text: line.replace('## ', ''),
                heading: HeadingLevel.HEADING_1,
                spacing: { before: 300, after: 150 }
            }));
            continue;
        }
        if (line.startsWith('### ')) {
            children.push(new Paragraph({
                text: line.replace('### ', ''),
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 200, after: 100 }
            }));
            continue;
        }

        // Blockquotes
        if (line.startsWith('> ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.replace('> ', ''),
                        italics: true,
                        color: "555555"
                    })
                ],
                indent: { left: 720 }, // 0.5 inch
                spacing: { before: 100, after: 100 }
            }));
            continue;
        }

        // List items
        if (line.startsWith('- ') || line.startsWith('* ')) {
            const text = line.substring(2);
            children.push(new Paragraph({
                text: text,
                bullet: { level: 0 },
                spacing: { before: 50, after: 50 }
            }));
            continue;
        }

        // Tables (Very basic rendering as text)
        if (line.startsWith('|')) {
             if(line.includes('---')) continue;
             const columns = line.split('|').filter(c => c.trim() !== '');
             const text = columns.map(c => c.trim()).join(' - ');
             children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: text,
                        font: "Courier New"
                    })
                ],
                spacing: { before: 50, after: 50 }
            }));
             continue;
        }


        // Basic bold/italic parsing (simplified)
        let textRuns = [];
        let remainingText = line;

        while (remainingText.length > 0) {
            const boldMatch = remainingText.match(/\*\*(.*?)\*\*/);
            const italicMatch = remainingText.match(/\*(.*?)\*/);

            let match = null;
            let type = '';

            if (boldMatch && (!italicMatch || boldMatch.index < italicMatch.index)) {
                match = boldMatch;
                type = 'bold';
            } else if (italicMatch) {
                match = italicMatch;
                type = 'italic';
            }

            if (match) {
                if (match.index > 0) {
                    textRuns.push(new TextRun({ text: remainingText.substring(0, match.index) }));
                }
                textRuns.push(new TextRun({
                    text: match[1],
                    bold: type === 'bold',
                    italics: type === 'italic'
                }));
                remainingText = remainingText.substring(match.index + match[0].length);
            } else {
                textRuns.push(new TextRun({ text: remainingText }));
                remainingText = '';
            }
        }

        children.push(new Paragraph({
            children: textRuns,
            spacing: { before: 100, after: 100 }
        }));
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: children
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Docx gerado com sucesso em: ${outputPath}`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Uso: node generate_docx.js <caminho_arquivo_md> <caminho_saida_docx>');
    process.exit(1);
}

const mdPath = args[0];
const outPath = args[1];

if (!fs.existsSync(mdPath)) {
    console.error(`Arquivo não encontrado: ${mdPath}`);
    process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf8');
createDocx(mdContent, outPath).catch(err => console.error(err));
