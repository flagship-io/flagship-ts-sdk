import { readdirSync, lstatSync, readFile, writeFile, mkdirSync } from "fs";
import path from "path";

function getDirectoryContent(directoryPath, type = null) {
  let directories = readdirSync(path.resolve(directoryPath), {
    withFileTypes: true,
  });
  switch (type) {
    case "f":
      directories = directories.filter((dirent) => dirent.isFile());
      break;
    case "d":
      directories = directories.filter((dirent) => dirent.isDirectory());
      break;
    default:
      break;
  }
  return directories.map((dirent) => dirent.name);
}

const src = "src";

const srcDirectory = getDirectoryContent(src, "d");

srcDirectory.forEach((rootDir) => {
  const rootDirPath = `${src}/${rootDir}`;
  const directories = getDirectoryContent(rootDirPath, null);
  directories.forEach((file) => {
    const filePath = `${rootDirPath}/${file}`;
    if (lstatSync(path.resolve(filePath)).isFile()) {
      readFile(path.resolve(filePath), (err, contentBuffer) => {
        var regex = /^import {((\n( {2}.*\n)+)|( [a-zA-z_]* ))} from '.*'/gm;
        const content = contentBuffer.toString("utf-8");
        let imports = content.match(regex);
        if (imports) {
          imports = imports.map((item) => {
            return item.replace(/'$/, ".ts'");
          });
          mkdirSync(`deno/${rootDirPath}`, { recursive: true });
          writeFile(
            path.resolve(`deno/${filePath}`),
            content.replace(regex, imports.join("\n")),
            (err) => {
              console.log("err", err);
            }
          );
          console.log(content.replace(regex, imports.join("\n")));
        }

        // process.exit(0);
      });
    }
  });
});

// console.log(srcDirectory);
