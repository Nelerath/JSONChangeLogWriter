const fs = require("fs");
const util = require("util");

const readDir = util.promisify(fs.readdir);
const writeFile = util.promisify(fs.writeFile);
//const readFile = util.promisify(fs.readFile);

const main = async () => {
  readDir("./Old")
    .then(async folders => {
      folders.forEach(x => CompareDirectory("./Old/" + x + "/", "./New/" + x + "/"));
    })
    .catch(e => console.error(e));
};

const CompareDirectory = async (oldPath, newPath) => {
  let changeLog = "";
  await readDir(oldPath)
    .then(files => {
      for (const x of files) {
        if (fs.existsSync(newPath + x)) {
          let oldContents = fs.readFileSync(oldPath + x);
          let newContent = fs.readFileSync(newPath + x);
          let oldObj = JSON.parse(oldContents.toString().replace(/@/g, ""));
          let newObj = JSON.parse(newContent.toString().replace(/@/g, ""));
          let diff = CompareFiles(oldObj, newObj, "");
          if (diff) {
            let name = oldObj.name_local || x;
            changeLog += "\n---------------------------------<" + name + ">---------------------------------";
            changeLog += diff;
            changeLog += "\n---------------------------------</" + name + ">---------------------------------";
          }
        }
      }
    })
    .catch(e => console.error(e));
  let thing = oldPath.split("/");
  await writeFile("./" + thing[thing.length - 2] + ".txt", changeLog).catch(e => console.error(e));
};

const CompareFiles = (oldObj, newObj, fieldPath) => {
  let changes = "";
  try {
    if (newObj) {
      for (let prop of Object.keys(oldObj).filter(x => Object.keys(newObj).indexOf(x) !== -1)) {
        if (oldObj[prop] && newObj[prop]) {
          if (typeof oldObj[prop] === "object") {
            changes += CompareFiles(oldObj[prop], newObj[prop], fieldPath + "." + prop);
          } else if (oldObj[prop] !== newObj[prop]) {
            changes += "\n" + fieldPath + "." + prop + ' changed from "' + oldObj[prop] + '" to "' + newObj[prop] + '"';
          }
        }
      }
    }
  } catch (error) {
    console.log(error);
  }

  return changes;
};

main();
