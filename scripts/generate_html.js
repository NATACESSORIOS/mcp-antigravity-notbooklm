const fs = require('fs');
const { marked } = require('marked');

function createHtml(markdownText, outputPath) {
    // Converte o Markdown para HTML usando o marked
    const htmlContent = marked.parse(markdownText);

    // Template HTML com um design premium, "Corporate Clean", adequado para relatórios jurídicos
    const htmlTemplate = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Análise Jurídica</title>
    <style>
        :root {
            --primary-color: #1a365d;
            --text-main: #2d3748;
            --text-muted: #718096;
            --bg-color: #f7fafc;
            --card-bg: #ffffff;
            --border-color: #e2e8f0;
            --accent-color: #3182ce;
        }

        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-main);
            line-height: 1.7;
            margin: 0;
            padding: 40px 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background-color: var(--card-bg);
            padding: 50px 60px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
            border-top: 6px solid var(--primary-color);
        }

        h1 {
            color: var(--primary-color);
            font-size: 2.2em;
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid var(--border-color);
            letter-spacing: -0.5px;
        }

        h2 {
            color: var(--primary-color);
            font-size: 1.5em;
            margin-top: 40px;
            margin-bottom: 20px;
            padding-left: 15px;
            border-left: 4px solid var(--accent-color);
        }

        h3 {
            color: var(--text-main);
            font-size: 1.2em;
            margin-top: 30px;
            margin-bottom: 15px;
        }

        p {
            margin-bottom: 1.2em;
            text-align: justify;
        }

        ul, ol {
            margin-bottom: 1.5em;
            padding-left: 25px;
        }

        li {
            margin-bottom: 0.5em;
        }

        strong {
            color: #1a202c;
            font-weight: 600;
        }

        blockquote {
            margin: 25px 0;
            padding: 20px 25px;
            background-color: #f8fafc;
            border-left: 4px solid var(--text-muted);
            font-style: italic;
            color: #4a5568;
            border-radius: 0 8px 8px 0;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            font-size: 0.95em;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        th, td {
            padding: 15px 20px;
            border-bottom: 1px solid var(--border-color);
            text-align: left;
        }

        th {
            background-color: #edf2f7;
            font-weight: 600;
            color: var(--primary-color);
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }

        tr:last-child td {
            border-bottom: none;
        }

        tr:hover {
            background-color: #f8fafc;
        }

        hr {
            border: 0;
            height: 1px;
            background: var(--border-color);
            margin: 40px 0;
        }

        .watermark {
            text-align: center;
            margin-top: 50px;
            font-size: 0.85em;
            color: var(--text-muted);
            border-top: 1px solid var(--border-color);
            padding-top: 20px;
        }

        @media print {
            body {
                background-color: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
                border: none;
                padding: 0;
            }
        }
    </style>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <div class="container">
        ${htmlContent}
        <div class="watermark">
            Documento processado eletronicamente por IA. Antigravity Legal Pipeline.
        </div>
    </div>
</body>
</html>`;

    fs.writeFileSync(outputPath, htmlTemplate, 'utf8');
    console.log(`HTML gerado com sucesso em: ${outputPath}`);
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.error('Uso: node generate_html.js <caminho_arquivo_md> <caminho_saida_html>');
    process.exit(1);
}

const mdPath = args[0];
const outPath = args[1];

if (!fs.existsSync(mdPath)) {
    console.error(`Arquivo não encontrado: ${mdPath}`);
    process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf8');
createHtml(mdContent, outPath);
