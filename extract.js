
const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\\\Users\\\\Maruf\\\\.gemini\\\\antigravity\\\\brain\\\\de8eb134-f7d4-48ae-b2ad-0cf6068a05d2\\\\.system_generated\\\\logs\\\\transcript.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const extracted = {};

  for await (const line of rl) {
    try {
      const parsed = JSON.parse(line);
      if (parsed.type === 'PLANNER_RESPONSE' && parsed.tool_calls) {
        for (const tc of parsed.tool_calls) {
          if (tc.name === 'multi_replace_file_content' || tc.name === 'replace_file_content') {
            const args = tc.args;
            if (args && args.TargetFile) {
               const target = args.TargetFile;
               if (args.ReplacementChunks) {
                  extracted[target] = args.ReplacementChunks;
               }
            }
          }
        }
      }
    } catch (e) {}
  }
  
  fs.writeFileSync('extracted_seo.json', JSON.stringify(extracted, null, 2));
  console.log('Extracted keys:', Object.keys(extracted));
}

processLineByLine();

