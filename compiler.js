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
let specialChars = "#!|*[]"

if (watch == "true") watch = true
else if (watch == "index") watch = "index"
else watch = false

var exit = ""
var metaMode = false
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
        lines.forEach(line => {
            // console.log('\x1b[33m%s\x1b[0m', "Compiled line: " + lines.indexOf(line) + ".")
            //remove \r
            line = line.replace("\r", "")
            //check if string starts with a special character
            if (line.startsWith("!ignore")) {
                exit += `<span>${line}</span>`
            } else if (line.startsWith("//")) {
                //ignore comments, they are not needed in the compiled file, carry on with the next line, but do not add \n
                return
            } else {
                let quick = interpret(line)
                if (quick != undefined) exit += quick
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
        exit = ""
    })
}

function interpret (line) {
    //base regex: /\*(.*)\*/gi
    let outputline = ""
    let replaced = false
    function regex (text, type) {
        let regex, executed
        if (type == "b") {
            regex = /\*\*(.*)\*\*/i
            executed = regex.exec(text)
            if (executed) return executed
            else return false
        } else if (type == "i") {
            regex = /\*(.*)\*/i
            executed = regex.exec(text)
            if (executed) return executed
            else return false
        } else if (type == "meta") {
            if (text == "<meta>") return true
            else return false
        } else if (type == "exclaim") {
            regex = /\[(.*)\]/i
            executed = regex.exec(text)
            if (executed) return executed
            else return false
        }
    }
    outputline += line
    function check (inputline) {
        replaced = false
        let bold = regex(line, "b")
        if (bold != false) {
            inputline = inputline.replace(/\*\*(.*)\*\*/gi, `<b>${bold[1]}</b>`)
        }
        let italic = regex(line, "i")
        if (italic != false) {
            inputline = inputline.replace(/\*(.*)\*/gi, `<i>${italic[1]}</i>`)
        }
        let exclaim = regex(line, "exclaim")
        if (exclaim != false) {
            let exclaimtext = exclaim[1]
            let exclaimtype = exclaimtext.split("$")[0]
            let exclaimlink = exclaimtext.split("$")[1]
            let linktype = ""
            let linksrc = ""
            let linktext = ""
            if (exclaimtype.startsWith("!img")) {
                //remove the !img
                exclaimtype = exclaimtype.replace("!img", "")
                linktype = "img"
                linksrc = `" src="${exclaimlink}`
                linktext = exclaimtype
            } else if (exclaimtype.startsWith("!link")) {
                //remove the !link
                exclaimtype = exclaimtype.replace("!link", "")
                linktype = "a"
                linksrc = exclaimlink
                linktext = exclaimtype
            } else if (exclaimtype.startsWith("!muted")) {
                linktype = "span"
                linksrc = '" class="muted'
            }
            inputline = inputline.replace(/\[(.*)\]/gi, `<${linktype} href="${linksrc}">${linktext}</${linktype}>`).replace("[", "").replace("]", "")
        }
        if (inputline.startsWith("#")) {
            let header = inputline.split(" ")[0]
            let headerText = inputline.replace(header, "")
            inputline = `<h${header.length}>${headerText}</h${header.length}>`
        }
        if (line.startsWith("title=")) {
            let title = inputline.replace("title=", "")
            inputline = `<script>setTitle("${title}")</script>`
        }
        if (line.startsWith("description=")) {
            let description = linputlineine.replace("description=", "")
            inputline = `<meta name="description" content="${description}">`
        }
        if (line.startsWith("date=")) {
            let keywords = inputline.replace("keywords=", "")
            inputline = `<meta name="date" content="${keywords}">`
        }
        return inputline
    }

    outputline = check(outputline)
    return outputline

}

if (watch != "index") {
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
} else if (watch == "index") {
    //
} else {
    compileAll()
}