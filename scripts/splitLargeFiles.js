const fs = require('fs');
const path = require('path');

console.log('🔪 Splitting large JS files...');

const jsDir = path.join(__dirname, '../build/static/js');
if (!fs.existsSync(jsDir)) {
  console.log('❌ Build directory not found!');
  process.exit(1);
}

const files = fs.readdirSync(jsDir);
let splitCount = 0;

files.forEach(file => {
  if (file.endsWith('.js') && !file.endsWith('.map') && !file.includes('LICENSE')) {
    const filePath = path.join(jsDir, file);
    const stats = fs.statSync(filePath);
    
    // Если файл больше 10KB - разбиваем
    if (stats.size > 10000) {
      console.log(`✂️  Splitting: ${file} (${Math.round(stats.size/1024)}KB)`);
      
      const content = fs.readFileSync(filePath);
      const chunkSize = 8000; // 8KB chunks
      const baseName = file.replace('.js', '');
      
      // Разбиваем на части
      for (let i = 0; i < content.length; i += chunkSize) {
        const chunk = content.slice(i, i + chunkSize);
        const chunkName = `${baseName}-part${Math.floor(i/chunkSize)}.js`;
        fs.writeFileSync(path.join(jsDir, chunkName), chunk);
        console.log(`   ✅ Created: ${chunkName} (${chunk.length} bytes)`);
      }
      
      // Удаляем оригинальный большой файл
      fs.unlinkSync(filePath);
      console.log(`   🗑️  Deleted original: ${file}`);
      splitCount++;
    }
  }
});

console.log(`🎉 Split ${splitCount} large files into small chunks!`);
