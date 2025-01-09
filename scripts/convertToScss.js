import fs from "fs/promises"
import path from "path"

async function convertCssToScss(directory) {
    try {
        const files = await fs.readdir(directory, { withFileTypes: true })

        for (const file of files) {
            const fullPath = path.join(directory, file.name)

            if (file.isDirectory()) {
                // Recursively process subdirectories
                await convertCssToScss(fullPath)
            } else if (file.name.endsWith(".css")) {
                // Read the CSS file
                const content = await fs.readFile(fullPath, "utf-8")

                // Create new SCSS file
                const newPath = fullPath.replace(".css", ".scss")
                await fs.writeFile(newPath, content)

                // Delete the old CSS file
                await fs.unlink(fullPath)

                console.log(
                    `Converted ${file.name} to ${path.basename(newPath)}`
                )
            }
        }
    } catch (error) {
        console.error("Error converting files:", error)
    }
}

// Start conversion from the src directory
convertCssToScss("./src")
