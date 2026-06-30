const fs = require('fs');
const path = require('path');

const routesDir = 'C:\\Users\\p8162\\.gemini\\antigravity\\scratch\\community-hero\\apps\\api\\src\\routes';
const files = fs.readdirSync(routesDir);

for (const file of files) {
  if (file.endsWith('.ts')) {
    const fullPath = path.join(routesDir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    let modified = content.replace(/['"]\.\.\/lib\/db(\.js)?['"]/g, "'../config/database.js'");
    
    // Also fix nativeEnum
    modified = modified.replace(/z\.nativeEnum\(prisma\.([a-zA-Z]+) as any\)/g, 'z.nativeEnum($1)');
    
    if (content !== modified) {
      if (modified.includes('z.nativeEnum(IssueCategory)') || modified.includes('z.nativeEnum(IssueStatus)') || modified.includes('z.nativeEnum(NotificationType)') || modified.includes('z.nativeEnum(IssueSeverity)') || modified.includes('z.nativeEnum(ChallengeTargetType)')) {
          modified = `import { IssueCategory, IssueSeverity, IssueStatus, NotificationType, ChallengeTargetType } from '@prisma/client';\n` + modified;
      }
      fs.writeFileSync(fullPath, modified);
      console.log(`Fixed ${file}`);
    }
  }
}
