import fs from "fs/promises"
import path from "path"

async function updateImports(directory) {
    try {
        const files = await fs.readdir(directory, { withFileTypes: true })

        for (const file of files) {
            const fullPath = path.join(directory, file.name)

            if (file.isDirectory()) {
                // Recursively process subdirectories
                await updateImports(fullPath)
            } else if (
                file.name.endsWith(".tsx") ||
                file.name.endsWith(".ts") ||
                file.name.endsWith(".jsx") ||
                file.name.endsWith(".js")
            ) {
                // Read the file content
                let content = await fs.readFile(fullPath, "utf-8")

                // Replace CSS imports with SCSS imports
                const cssImportRegex = /import ['"](.+)\.css['"]/g
                const updated = content.replace(
                    cssImportRegex,
                    (match, p1) => `import '${p1}.scss'`
                )

                // Only write if content was changed
                if (content !== updated) {
                    await fs.writeFile(fullPath, updated, "utf-8")
                    console.log(`Updated imports in ${file.name}`)
                }
            }
        }
    } catch (error) {
        console.error("Error updating imports:", error)
    }
}

// Start from the src directory
updateImports("./src")
