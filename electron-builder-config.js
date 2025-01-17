/* eslint-disable no-undef */
/**
 * @see https://www.electron.build/configuration/configuration
 */

const path = require('path')
const fs = require('fs')
const bytenode = require('bytenode')
const v8 = require('v8')
const glob = require('glob')

// electron build 打包的时候生成
//未知不一样，路径也不同
// fixme 此方法应该用electron执行
function createJsc() {
  v8.setFlagsFromString('--no-lazy')
  // ode_modules/electron/dist/electron electron-builder-config.js 先执行过了，electron-builder就不会再生成jsc文件了
  if (!fs.existsSync(path.join(__dirname, './dist-electron/main/index.jsc'))) {
    bytenode
      .compileFile(
        path.join(__dirname, './dist-electron/main/index.js'),
        path.join(__dirname, './dist-electron/main/index.jsc')
      )
      .then(() => {
        // fs.unlinkSync(path.join(__dirname, './dist-electron/main.js'))
      })
      .finally(() => {
        console.log('do compile main complted')
      })
  }
//   if (!fs.existsSync(path.join(__dirname, './dist-electron/preload.jsc'))) {
//     bytenode
//       .compileFile(
//         path.join(__dirname, './dist-electron/preload.js'),
//         path.join(__dirname, './dist-electron/preload.jsc')
//       )
//       .then(() => {
//         // fs.unlinkSync(path.join(__dirname, './dist-electron/main.js'))
//       })
//       .finally(() => {
//         console.log('do compile preload complted')
//       })
//   }
}
createJsc()
const argv = process.argv
console.log('argv', argv)
if (argv && argv.length > 1) {
  // window环境下时这种
  // argv [
  //   'C:\\Program Files\\nodejs\\node_modules\\electron\\dist\\electron.exe',
  //   '.\\electron-builder-config.js'
  // ]
  if (argv[0].endsWith('electron.exe') && argv[1].endsWith('electron-builder-config.js')) {
    // 大概是自己写的
    //  node_modules/electron/dist/electron electron-builder-config.js 需要在electron环境下将jsc编译出来
    console.log('call by electron in node_modules, to complie jsc, exit later.')
    process.exit(0)
  }
}

// 是否需要加密 同时需要自己将  "main": "dist-electron/main.bytenode.js", 改成   "main": "dist-electron/main.js",
const needByteNode = true
const useAsar = false

const files = [
  'dist',
  'icon.ico',
  // 'dist-electron/preload.js',
//   'dist-electron/main/index.jsc',
  '!package.json',
  'dist-electron/preload/index.js',
  '!src/**/*.spec.js' // 排除所有以 .spec.js 结尾的文件

  // '!node_modules' // 将element-plus等纯前端的东西放到devDependencies
]

const extraFiles = []

if (needByteNode) {
  files.push('dist-electron/main/index.bytenode.js')
  files.push('dist-electron/main/index.jsc')
} else {
  files.push('dist-electron/main.js')
}

// asarUnpack 不打包的部分
const asarUnpack = [
  // 'dist-electron/main.jsc',
  // 'dist-electron/preload.jsc'
]

// eslint-disable-next-line no-unused-vars
function getModuleDependencies(ele) {
  console.log('获取相关依赖 ', ele)
  let innerPath = 'node_modules/' + ele
  // innerPath = path.join(__dirname, innerPath)
  if (files.indexOf(innerPath) === -1) {
    files.push(innerPath)
    asarUnpack.push(innerPath)
  }

  // eslint-disable-next-line no-undef
  const packageFilePath = path.join(__dirname, `node_modules/${ele}/package.json`)
  if (fs.existsSync(packageFilePath)) {
    // eslint-disable-next-line no-undef
    const obj = require(packageFilePath)
    if (obj.dependencies) {
      const keys = Object.keys(obj.dependencies)
      keys.forEach((key) => {
        let innerSubPath = 'node_modules/' + key
        // innerSubPath = path.join(__dirname, innerSubPath)
        if (files.indexOf(innerSubPath) === -1) {
          files.push(innerSubPath)
          asarUnpack.push(innerSubPath)
          getModuleDependencies(key)
        }
      })
    }
  }

  // 适应typeorm
  const subPackagesFilePath = path.join(
    __dirname,
    `node_modules/${ele}/node_modules/*/package.json`
  )
  glob.sync(subPackagesFilePath).forEach((subEntry) => {
    console.log('subPackagesFilePath subEntry', subEntry)
    if (fs.existsSync(subEntry)) {
      // eslint-disable-next-line no-undef
      const obj = require(subEntry)
      if (obj.dependencies) {
        const keys = Object.keys(obj.dependencies)
        keys.forEach((key) => {
          let innerSubPath = 'node_modules/' + key
          // innerSubPath = path.join(__dirname, innerSubPath)
          if (
            files.indexOf(innerSubPath) === -1 &&
            fs.existsSync(path.join(__dirname, innerSubPath))
          ) {
            files.push(innerSubPath)
            asarUnpack.push(innerSubPath)
            getModuleDependencies(key)
          }
        })
      }
    }
  })
}

extraFiles.push({
  from: path.join(__dirname, './public/package.json'),
  to: '.',
  filter: '**/*'
})

//


// eslint-disable-next-line no-undef
// return the config
files.sort()
asarUnpack.sort()

console.log('files', files)

const finalResult = {
    "directories": {
        "output": "release/${version}"
      },
  // $schema: 'https://raw.githubusercontent.com/electron-userland/electron-builder/master/packages/app-builder-lib/scheme.json',
  appId: 'YourAppID',
  asar: useAsar,
  asarUnpack: asarUnpack,
  files: files,
  productName: 'YourAppName',
  npmRebuild: false, // 有需要使用electron-rebuild代替, 例如 electron-rebuild -o better-sqlite3
  nodeGypRebuild: false,
  copyright: 'Copyright © 2020 your company',
  directories: {
    // "output": "release/${version}"
    output: 'build/${version}'
  },
  generateUpdatesFilesForAllChannels: true,
  mac: {
    target: ['dmg'],
    artifactName: '${productName}-Mac-${version}-Installer.${ext}'
  },
  win: {
    target: [
      // {
      //   target: 'portable'
      // },
      {
        target: 'nsis',
        arch: ['x64']
      }
      // {
      //   target: '7z'
      // }
    ],
    artifactName: '${productName}-Windows-${arch}-${version}-${channel}-Setup.${ext}'
  },
  portable: {
    // 启动太久了，不推荐
    artifactName: '${productName}-Windows-${arch}-${version}-${channel}.${ext}'
  },
  // https://www.electron.build/configuration/nsis
  nsis: {
    // output: 'build/${version}-nsis/',
    oneClick: false, // 一键式安装程序还是辅助安装程序
    perMachine: false, // oneClick false perMachine true 为计算机安装  oneClick false perMachine false 可以选择为计算机安装还是为当前用户安装
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
    installerIcon: './icon.ico',
    // license: './license.txt'
  },
  linux: {
    target: ['AppImage'],
    artifactName: '${productName}-Linux-${version}.${ext}'
  },
  extraFiles: extraFiles
}
console.log('------------------------------------')
console.log(JSON.stringify(finalResult, null, 4))

// eslint-disable-next-line no-undef
// return the config
module.exports = finalResult
