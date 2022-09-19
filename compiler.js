const fs = require("fs")
const path = require("path")
const chokidar = require("chokidar")

//add push to string prototype
String.prototype.push = function (str) {
    return this + str
}
//get args from command
const args = process.argv.slice(2)
//get input folder
const inputFolder = args[0]
//get output folder
const outputFolder = args[1]
//watch
let watch = args[2]
if (!watch) watch = false

let last = []
let specialChars = "#!|*"

if (watch == "true") watch = true
else watch = false
function compileAll (inputfile) {
    if (!inputfile) inputfile = inputFolder
    if (inputfile.endsWith(".koneko")) return
    fs.readdir(inputfile, (err, files) => {
        if (err) {
            console.error(err)
            return
        }
        files.forEach(file => {
            if (!file.endsWith(".koneko")) return
            console.log("\x1b[35m%s\x1b[0m", "Compiled file " + file + ".")
            compile(file, inputfile)
        })
        //check for subfolders
        fs.readdir(inputfile, (err, files) => {
            if (err) {
                console.error(err)
                return
            }
            files.forEach(file => {
                if (file.endsWith(".koneko")) return
                if (fs.lstatSync(path.join(__dirname, inputFolder, file.replace(/\\/g, "/"))).isDirectory()) {
                    compileAll(path.join(__dirname, inputFolder, file.replace(/\\/g, "/")))
                }
            })
        })
    })
}

function compile (file, inputfolder) {
    if (!inputfolder) inputfolder = ""
    fs.readFile(path.join(inputfolder, file.replace(/\\/g, "/")), "utf8", (err, data) => {
        //check if file ends with .koneko
        if (!file.endsWith(".koneko")) return
        if (err) {
            console.error(err)
            return
        }
        const lines = data.split("\n")
        let exit = ""
        lines.forEach(line => {
            // console.log('\x1b[33m%s\x1b[0m', "Compiled line: " + lines.indexOf(line) + ".")
            //remove \r
            line = line.replace("\r", "")

            function s (str) {
                return line.startsWith(str)
            }

            function e (str) {
                return line.endsWith(str)
            }

            function c (str) {
                return line.includes(str)
            }
            //check if string starts with a special character
            if (!specialChars.includes(line[0])) {
                exit += `<span>${line}</span>`
            } else {
                if (s("###")) {
                    //add <h3> to beginning of line and </h3> to end
                    exit += `<h3>${line.replace("###", "")}</h3>`
                } else if (s("##")) {
                    //add <h2> to beginning of line and </h2> to end
                    exit += `<h2>${line.replace("##", "")}</h2>`
                } else if (s("#")) {
                    //add <h1> to beginning of line and </h1> to end
                    exit += `<h1>${line.replace("#", "")}</h1>`
                }

                if (s("**") && e("**")) {
                    exit += `<b>${line.replace(/\*\*/g, "")}</b>`
                } else if (s("*") && e("*")) {
                    exit += `<i>${line.replace(/\*/g, "")}</i>`
                }

                if (s("!muted")) {
                    exit += `<p class="muted">${line.replace("!muted", "")}</p>`
                }

                if (s("!link")) {
                    const link = line.replace("!link", "").split("$link")
                    exit += `<a href="${link[1]}">${link[0]}</a>`
                }

                if (s("!img")) {
                    const img = line.replace("!img", "").split("$img")
                    exit += `<img src="${img[1]}" alt="${img[0]}">`
                }

                if (s("!p")) {
                    exit += `<p>${line.replace("!p", "")}</p>`
                }

                if (line == "lb") exit += "<br>"

                if (s("|!") && e("!|")) {
                    exit += `<script>document.title = "${line.replace("|!", "").replace("!|", "")}";document.querySelector(".headertitle").innerHTML = "${line.replace("|!", "").replace("!|", "")}"</script>`
                }

            }
            //if last line, no \n
            if (lines.indexOf(line) !== lines.length - 1) {
                exit += "\n"
            }
        })
        //dont touch legacy traversal code 💀💀💀💀💀
        let name = file.replace(".koneko", ".html")
        let content = fs.readFileSync(path.join("./base.html"), "utf8")
        content = content.replace("{{content}}", exit)
        content += `<script src="/utils/utils.js"></script><link rel="stylesheet" href="/utils/style.css">`
        let bad = outputFolder.replace("./", "")
        let inputfoldercustom = inputFolder.replace("./", "")
        bad = file.replace(inputFolder.replace("./", ""), bad).replace(".koneko", ".html")
        if (inputfolder == "") {
            fs.writeFile(path.join(__dirname, bad), content, err => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        } else {
            fs.writeFile(path.join(inputfolder.replace(inputfoldercustom, outputFolder.replace("./", "")), bad), content, err => {
                if (err) {
                    console.error(err)
                    return
                }
            })
        }

    })
}

if (watch) {
    console.log("\x1b[36m%s\x1b[0m", "Watch mode enabled.")
    console.log("\x1b[33m%s\x1b[0m", "Watching folder " + inputFolder + " for changes and outputing compilation to " + outputFolder + ".")

    const watcher = chokidar.watch(inputFolder, {
        ignored: /(^|[\/\\])\../,
        persistent: true
    })
    watcher.on("change", pth => {
        console.log("\x1b[31m%s\x1b[0m", "[" + `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}` + "] Recompiled file " + pth.split("\\")[pth.split("\\").length - 1] + ".");
        compile(pth)
    })
    watcher.on("unlink", pth => {
        console.log("\x1b[31m%s\x1b[0m", "[" + `${new Date().getHours()}:${new Date().getMinutes()}:${new Date().getSeconds()}` + "] Deleted file " + pth.split("\\")[pth.split("\\").length - 1] + ".");
        let bad = outputFolder.replace("./", "")
        let inputfoldercustom = inputFolder.replace("./", "")
        bad = pth.replace(inputFolder.replace("./", ""), bad).replace(".koneko", ".html")
        fs.unlink(path.join(__dirname, bad), err => {
            if (err) {
                console.error(err)
                return
            }
        })
    })
} else {
    compileAll()
}