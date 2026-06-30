const fs = require('fs');
const path = require('path');

const historyDir = 'C:\\Users\\p8162\\AppData\\Roaming\\Code\\User\\History';
const targetDir = 'C:\\Users\\p8162\\.gemini\\antigravity\\scratch\\community-hero\\scratch\\recovered_files';

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

const folders = fs.readdirSync(historyDir);
for (const folder of folders) {
  const folderPath = path.join(historyDir, folder);
  if (fs.statSync(folderPath).isDirectory()) {
    const entriesPath = path.join(folderPath, 'entries.json');
    if (fs.existsSync(entriesPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(entriesPath, 'utf8'));
        if (data.resource && data.resource.includes('community-hero/apps/api/src/routes/')) {
           // We found a history folder for one of our files!
           const filename = data.resource.split('/').pop();
           console.log(`Found history for ${filename}`);
           
           // Sort entries by timestamp descending
           const entries = data.entries.sort((a, b) => b.timestamp - a.timestamp);
           
           // Copy the most recent non-corrupted file
           for (const entry of entries) {
              const fileId = entry.id;
              const sourceFile = path.join(folderPath, fileId);
              if (fs.existsSync(sourceFile)) {
                 const content = fs.readFileSync(sourceFile, 'utf8');
                 // Only use it if it's longer than the 3-line corrupted version, e.g. contains actual newlines
                 if (content.split('\n').length > 5 && !content.includes('truncated')) {
                    fs.writeFileSync(path.join(targetDir, filename), content);
                    console.log(`Recovered ${filename} from ${fileId} (${new Date(entry.timestamp).toISOString()})`);
                    break;
                 }
              }
           }
        }
      } catch (err) {
        console.error('Error parsing', entriesPath, err);
      }
    }
  }
}
