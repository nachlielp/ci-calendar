import { readFileSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const swPath = join(__dirname, "../../public/sw.js")
const sw = readFileSync(swPath, "utf8")

// Use timestamp or increment existing version
const newVersion = Date.now()
const updatedSw = sw.replace(
    /(const CACHE_NAME = "ci-calendar-cache-v)(\d+)"/,
    `$1${newVersion}"`
)

writeFileSync(swPath, updatedSw)
