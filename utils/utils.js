function setTitle (title) {
    document.title = title
    document.querySelector(".headertitle").innerHTML = title
}

function changeColor (color) {
    let style = document.createElement("style")
    style.innerHTML = `:root {--color-background: ${color};}`
    document.querySelector("head").appendChild(style)
}

function changeIconColor (color) {
    document.getElementById("iconmeta").setAttribute("href", color)
}