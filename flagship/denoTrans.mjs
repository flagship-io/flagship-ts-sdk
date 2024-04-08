import { readdirSync, lstatSync, readFile, writeFile, mkdirSync, copyFileSync, existsSync } from 'fs'
import path from 'path'

function getDirectoryContent (dirPath) {
  const directories = readdirSync(dirPath, {
    withFileTypes: true
  })
  return directories
    .filter((dirent) => dirent.isFile() || dirent.isDirectory)
    .map((dirent) => dirent.name)
}

function transformFromDir (dirPath, packageResolves) {
  const srcDirectory = getDirectoryContent(dirPath)
  srcDirectory.forEach((rootDir) => {
    const rootDirPath = path.join(dirPath, rootDir)
    if (lstatSync(rootDirPath).isFile()) {
      transformFile(rootDirPath, dirPath, packageResolves)
    } else {
      transformFromDir(rootDirPath, packageResolves)
    }
  })
}

const REGEX = [
  /^import {.+} from ['"].+['"]/gm,
  /^import {[\n\r](.*[\n\r])+} from ['"].+['"]/gm,
  /^export .* from ['"].*['"]/gm,
  /^export {[\n\r](.*[\n\r])*} from ['"].*['"]/gm
]

function transformFile (filePath, dirPath, packageResolves) {
  readFile(filePath, (err, contentBuffer) => {
    if (err) {
      console.log('err: ', err)
      return
    }

    let content = contentBuffer.toString('utf-8')

    const replaceRegex = (item) => {
      const lastChar = item.substring(item.length - 1)
      content = content.replace(item, item.replace(/'$/gm, '.ts' + lastChar))
    }

    REGEX.forEach(regex => {
      const match = content.match(regex)
      match?.forEach(replaceRegex)
    })

    if (packageResolves) {
      for (const key in packageResolves) {
        const regex5 = new RegExp(
          "^import {.+} from ['\"].*" + key + ".ts['\"]",
          'gm'
        )
        const match5 = content.match(regex5)
        if (match5) {
          match5.forEach((item) => {
            content = content.replace(
              item,
              item.replace(key, packageResolves[key])
            )
          })
        }
      }
    }

    mkdirSync(`${flagshipDistDeno}/${dirPath}`, { recursive: true })
    writeFile(path.resolve(`${flagshipDistDeno}/${filePath}`), content, (writeErr) => {
      if (writeErr) {
        console.log('err', writeErr)
      }
    })
  })
}

const packageResolve = {
  NodeHttpClient: 'DenoHttpClient',
  '../depsNode.native': '../depsDeno'
}
const src = 'src'
const flagshipDistDeno = 'flagship/dist-deno'
transformFromDir(src, packageResolve)

const distDenoSrc = flagshipDistDeno + '/src'
if (!existsSync(distDenoSrc)) {
  mkdirSync(distDenoSrc, { recursive: true })
}
copyFileSync('./README.md', distDenoSrc + '/README.md')
