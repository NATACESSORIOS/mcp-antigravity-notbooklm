const fs = require('fs');
const path = require('path');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

async function createDocx(markdownText, outputPath) {
    const lines = markdownText.split('\n');
    const children = [];

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trimEnd();

        if (line === '' || line.startsWith('---')) {
            continue; // Ignorar linhas em branco ou separadores
        }

        // Título Principal (H1) - Centralizado, Negrito, Caixa Alta (estilo capa/cabeçalho)
        if (line.startsWith('# ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.replace('# ', '').toUpperCase(),
                        bold: true,
                        size: 28, // 14pt
                        font: "Arial"
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 400, after: 400 }
            }));
            continue;
        }
        
        // Subtítulo (H2) - Tópicos do Relatório
        if (line.startsWith('## ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.replace('## ', ''),
                        bold: true,
                        size: 24, // 12pt
                        font: "Arial"
                    })
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 300, after: 150 }
            }));
            continue;
        }

        // Seções menores (H3)
        if (line.startsWith('### ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.replace('### ', ''),
                        bold: true,
                        italics: true,
                        size: 24, // 12pt
                        font: "Arial"
                    })
                ],
                alignment: AlignmentType.LEFT,
                spacing: { before: 200, after: 100 }
            }));
            continue;
        }

        // Citações (Blockquotes)
        if (line.startsWith('> ')) {
            children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: line.replace('> ', ''),
                        italics: true,
                        size: 22, // 11pt
                        font: "Arial"
                    })
                ],
                indent: { left: 1134 }, // 2 cm (1 cm = 567 twips)
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 150, after: 150 }
            }));
            continue;
        }

        // Listas (Bullets)
        if (line.startsWith('- ') || line.startsWith('* ')) {
            const text = line.substring(2);
            children.push(new Paragraph({
                children: parseInlineStyles(text),
                bullet: { level: 0 },
                alignment: AlignmentType.JUSTIFIED,
                spacing: { before: 100, after: 100 }
            }));
            continue;
        }

        // Tabelas (Tratadas como parágrafos simples tabulados por enquanto)
        if (line.startsWith('|')) {
             if(line.includes('---')) continue;
             const columns = line.split('|').filter(c => c.trim() !== '');
             const text = columns.map(c => c.trim()).join(' — ');
             children.push(new Paragraph({
                children: [
                    new TextRun({
                        text: text,
                        font: "Arial",
                        size: 24
                    })
                ],
                indent: { left: 567 }, // 1 cm
                alignment: AlignmentType.LEFT,
                spacing: { before: 50, after: 50 }
            }));
             continue;
        }

        // Parágrafos normais (Corpo do Relatório)
        children.push(new Paragraph({
            children: parseInlineStyles(line),
            alignment: AlignmentType.JUSTIFIED,
            indent: { firstLine: 708 }, // 1.25 cm (recuo de primeira linha)
            spacing: { before: 150, after: 150, line: 360 } // Line 360 = 1.5 spacing
        }));
    }

    const doc = new Document({
        styles: {
            default: {
                document: {
                    run: {
                        font: "Arial",
                        size: 24, // 12pt padrão
                        color: "000000",
                    },
                    paragraph: {
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: {
                            line: 360, // espaçamento 1.5
                        },
                    },
                },
            }
        },
        sections: [{
            properties: {},
            children: children
        }]
    });

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);
    console.log(`Docx gerado com sucesso em: ${outputPath}`);
}

// Função auxiliar para processar negrito e itálico dentro do parágrafo
function parseInlineStyles(text) {
    let textRuns = [];
    let remainingText = text;

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
                textRuns.push(new TextRun({ 
                    text: remainingText.substring(0, match.index),
                    font: "Arial",
                    size: 24
                }));
            }
            textRuns.push(new TextRun({
                text: match[1],
                bold: type === 'bold',
                italics: type === 'italic',
                font: "Arial",
                size: 24
            }));
            remainingText = remainingText.substring(match.index + match[0].length);
        } else {
            textRuns.push(new TextRun({ 
                text: remainingText,
                font: "Arial",
                size: 24
            }));
            remainingText = '';
        }
    }
    return textRuns;
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
