const fs = require("fs")
const path = require("path")

// This would run after your build
function generateCacheList() {
    const buildDir = path.join(__dirname, "../.next/static") // Adjust path as needed
    const cacheList = []

    // Recursively find all JS and CSS files
    function walkDir(dir) {
        const files = fs.readdirSync(dir)
        files.forEach((file) => {
            const filePath = path.join(dir, file)
            const stat = fs.statSync(filePath)
            if (stat.isDirectory()) {
                walkDir(filePath)
            } else if (file.endsWith(".js") || file.endsWith(".css")) {
                cacheList.push(filePath.replace(buildDir, "/_next/static"))
            }
        })
    }

    walkDir(buildDir)

    // Update service worker with new cache list
    const swPath = path.join(__dirname, "../public/firebase-messaging-sw.js")
    let swContent = fs.readFileSync(swPath, "utf8")

    // Insert cache list into service worker
    const cacheListString = JSON.stringify(cacheList, null, 2)
    swContent = swContent.replace(
        /const FILES_TO_CACHE = \[([\s\S]*?)\]/,
        `const FILES_TO_CACHE = ${cacheListString}`
    )

    fs.writeFileSync(swPath, swContent)
}

generateCacheList()
