import fs from "fs";

const file = "data/posted.json";

export function isDuplicate(projectName) {

  const posted = JSON.parse(fs.readFileSync(file));

  if (posted.includes(projectName)) {
    return true;
  }

  posted.push(projectName);
  fs.writeFileSync(file, JSON.stringify(posted, null, 2));

  return false;
}
