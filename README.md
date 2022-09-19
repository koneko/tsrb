# koneko-markdown
markdown modification by koneko  
files end with `.koneko` and get compiled to `.html` and are viewable in the browser via a server  
## usage
`node compiler.js <path to .koneko files> <path to compiled .html files> <watch = true/false>`  
e.g
`node compiler.js ./raw ./pages true`

## syntax
---
headings  
```
# h1
## h2
### h3
```
---
bold & italic  
```
**bold**
*italic*
```
---
line breaks
```
lb 
```
---
title
```
|!title!|
```
---
exclaims
```
!muted<text>
!link<text>$link<actual link>
!img<reader text>$img<link to image>
!p<text> (as paragraph)
```

### utils and extras
nothing yet but will add soon when i rework the compiler to support multiple stuff! yay 😊😊😊