const fs = require("fs");
const content = fs.readFileSync("./database/seeds/001_seed.sql", "utf8");

const fixed = content
  .replace(/'d-0000-4000-8000-/g, "'d1000000-0000-4000-8000-")
  .replace(/'e-0000-4000-8000-/g, "'e1000000-0000-4000-8000-")
  .replace(/'f-0000-4000-8000-/g, "'f1000000-0000-4000-8000-")
  .replace(/d-0000-4000-8000-/g, "d1000000-0000-4000-8000-");

fs.writeFileSync("./database/seeds/001_seed.sql", fixed, "utf8");
console.log("✅ Fixed all broken UUIDs");
