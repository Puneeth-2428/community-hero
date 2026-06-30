const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\p8162\\.gemini\\antigravity\\brain\\c8dd4744-1921-4df9-b76e-e56137c6c153\\.system_generated\\logs\\overview.txt';
const logData = fs.readFileSync(logPath, 'utf8');

const lines = logData.split('\n');
const routesDir = path.join('C:\\Users\\p8162\\.gemini\\antigravity\\scratch\\community-hero\\apps\\api\\src\\routes');

const recoveredFiles = {};

for (const line of lines) {
  try {
    const entry = JSON.parse(line);
    if (entry.tool_calls) {
      for (const call of entry.tool_calls) {
        if (call.name === 'write_to_file' || call.name === 'multi_replace_file_content' || call.name === 'replace_file_content') {
          // Just grab write_to_file for simplicity first, as it created the files
          if (call.name === 'write_to_file') {
             const target = call.args?.TargetFile;
             if (target && target.includes('apps\\\\api\\\\src\\\\routes') || target?.includes('apps/api/src/routes')) {
                const basename = path.basename(target.replace(/\\\\/g, '/').replace(/"/g, ''));
                recoveredFiles[basename] = call.args.CodeContent;
             }
          }
        }
      }
    }
  } catch(e) {}
}

for (const [file, content] of Object.entries(recoveredFiles)) {
   let rawContent = content;
   if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
       try {
           rawContent = JSON.parse(rawContent);
       } catch(e) {}
   }
   console.log(`Recovered ${file}`);
   fs.writeFileSync(path.join(routesDir, file), rawContent);
}
