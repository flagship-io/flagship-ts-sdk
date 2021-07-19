import { readdirSync, lstatSync, readFile, writeFile, mkdirSync } from "fs";
import path from "path";

function getDirectoryContent(dirPath) {
  const directories = readdirSync(dirPath, {
    withFileTypes: true,
  });
  return directories
    .filter((dirent) => dirent.isFile() || dirent.isDirectory)
    .map((dirent) => dirent.name);
}

const src = "src";
function transformFromDir(dirPath, packageResolves = null) {
  const srcDirectory = getDirectoryContent(dirPath);
  srcDirectory.forEach((rootDir) => {
    const rootDirPath = `${dirPath}/${rootDir}`;
    if (lstatSync(rootDirPath).isFile()) {
      transformFile(rootDirPath, dirPath, packageResolves);
    } else {
      transformFromDir(rootDirPath, packageResolves);
    }
  });
}

function transformFile(filePath, dirPath, packageResolves = null) {
  readFile(filePath, (err, contentBuffer) => {
    if (err) {
      console.log("err: ", err);
      return;
    }
    const regex1 = /^import {.+} from ['"].+['"]/gm;

    let content = contentBuffer.toString("utf-8");

    const match1 = content.match(regex1);

    match1?.forEach((item) => {
      const lastChar = item.substring(item.length - 1);
      content = content.replace(item, item.replace(/'$/gm, ".ts" + lastChar));
    });

    const regex2 = /^import {[\n\r](.*[\n\r])+} from ['"].+['"]/gm;

    let match2 = content.match(regex2);

    match2?.forEach((item) => {
      const lastChar = item.substring(item.length - 1);
      content = content.replace(item, item.replace(/'$/gm, ".ts" + lastChar));
    });

    const regex3 = /^export .* from ['"].*['"]/gm;
    let match3 = content.match(regex3);

    match3?.forEach((item) => {
      const lastChar = item.substring(item.length - 1);
      content = content.replace(
        item,
        item.replace(/['"]$/gm, ".ts" + lastChar)
      );
    });

    const regex4 = /^export {[\n\r](.*[\n\r])*} from ['"].*['"]/gm;
    let match4 = content.match(regex4);

    match4?.forEach((item) => {
      const lastChar = item.substring(item.length - 1);
      content = content.replace(
        item,
        item.replace(/['"]$/gm, ".ts" + lastChar)
      );
    });

    if (packageResolves) {
      for (const key in packageResolves) {
        const regex5 = new RegExp(
          "^import {.+} from ['\"].*" + key + ".ts['\"]",
          "gm"
        );
        let match5 = content.match(regex5);
        match5?.forEach((item) => {
          content = content.replace(
            item,
            item.replace(key, packageResolves[key])
          );
        });
      }
    }

    mkdirSync(`deno/${dirPath}`, { recursive: true });
    writeFile(path.resolve(`deno/${filePath}`), content, (writeErr) => {
      if (writeErr) {
        console.log("err", writeErr);
      }
    });
  });
}

const packageResolve = {
  NodeHttpClient: "DenoHttpClient",
};

transformFromDir(src, packageResolve);
