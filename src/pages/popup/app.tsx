import React from "react"
import {createRoot} from "react-dom/client"
import Click from "../options/click.tsx"

// @ts-ignore
const root = createRoot(document.getElementById("root"))

root.render(<Click />)