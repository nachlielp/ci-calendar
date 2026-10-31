import { BUILD_VERSION } from "../buildVersion"
import { browserStorage } from "../deviceStorage"
import { createBrowserTelemetry } from "./browserTelemetry"

/**
 * The page's telemetry, created as main.tsx's first import so errors are
 * captured before any other module of the app runs.
 */
export const appTelemetry = createBrowserTelemetry(
    browserStorage(),
    BUILD_VERSION,
)
