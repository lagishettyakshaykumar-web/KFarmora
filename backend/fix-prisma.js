const fs = require('fs');
let s = fs.readFileSync('prisma/schema.prisma', 'utf8');
s = s.replace(/provider\s*=\s*"mongodb"/, 'provider = "sqlite"');
s = s.replace(/@default\(auto\(\)\) @map\("_id"\) @db\.ObjectId/g, '@default(uuid())');
s = s.replace(/@db\.ObjectId/g, '');
fs.writeFileSync('prisma/schema.prisma', s);
