const fs = require('fs');
let schema = fs.readFileSync('packages/database/prisma/schema.prisma', 'utf8');

// 1. Change provider
schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');

// 2. Remove all enums
schema = schema.replace(/enum \w+ \{[\s\S]*?\}/g, '');

// 3. Remove all @db.Uuid, @db.Text, @db.Decimal annotations
schema = schema.replace(/@db\.\w+(\([^)]+\))?/g, '');

// 4. Change Enum types to String in model fields
// We know all the enum names from before, but we can also just find Capitalized types that aren't relations.
const enums = ["Role", "AuthProvider", "TwoFactorStatus", "BadgeType", "ReputationAction", "EventStatus", "AttendanceStatus", "MentorStatus", "BookingStatus", "PostType", "PostVisibility", "ConversationType", "MessageStatus", "StudyGroupStatus", "JoinRequestStatus", "FileType", "ProductStatus"];

enums.forEach(e => {
    const regex = new RegExp((\\w+\\s+)(\\s+), 'g');
    schema = schema.replace(regex, $1String);
    const regexDefault = new RegExp(default\\((\\w+)\\), 'g');
    // For enum defaults like @default(STUDENT), we need to add quotes @default("STUDENT")
    // Let's do a generic replacement for defaults that don't have quotes and aren't numbers or booleans, or functions like now()
});

// Fix unquoted enum defaults
schema = schema.replace(/@default\((?!true|false|now\(\)|uuid\(\)|autoincrement\(\)|\d)([^"'\)]+)\)/g, '@default("")');

// 5. Change String[] to String
schema = schema.replace(/String\[\]/g, 'String');

// 6. Change Decimal to Float
schema = schema.replace(/Decimal/g, 'Float');

// 7. Change Json to String
schema = schema.replace(/Json/g, 'String');

fs.writeFileSync('packages/database/prisma/schema.prisma', schema);
console.log('Schema converted to SQLite successfully.');
