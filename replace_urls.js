const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('apps/web/src');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  
  // Replace instances that are already in backticks
  if (content.includes('`http://localhost:4000/api/v1')) {
    content = content.replace(/`http:\/\/localhost:4000\/api\/v1/g, '`${process.env.NEXT_PUBLIC_API_URL}');
    changed = true;
  }
  
  // Replace instances in single quotes
  if (content.includes('\'http://localhost:4000/api/v1')) {
    content = content.replace(/'http:\/\/localhost:4000\/api\/v1([^']*)'/g, '`${process.env.NEXT_PUBLIC_API_URL}$1`');
    changed = true;
  }
  
  // Replace 127.0.0.1 NextAuth instance
  if (content.includes('\'http://127.0.0.1:4000/api/v1')) {
    content = content.replace(/'http:\/\/127.0.0.1:4000\/api\/v1([^']*)'/g, '`${process.env.NEXT_PUBLIC_API_URL}$1`');
    changed = true;
  }

  // Socket.io or other bare connections
  if (content.includes('\'http://localhost:4000\'')) {
    content = content.replace(/'http:\/\/localhost:4000'/g, '(process.env.NEXT_PUBLIC_API_URL ? process.env.NEXT_PUBLIC_API_URL.replace(\'/api/v1\', \'\') : \'http://localhost:4000\')');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
