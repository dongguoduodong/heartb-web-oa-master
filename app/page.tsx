import fs from "fs/promises"
import path from "path"
import HomePage from "./page.client"

interface StoryFile {
  key: string
  label: string
}

export default async function Home() {
  const inputDirPath = path.join(process.cwd(), "input-txt")

  let fileNames: string[] = []

  try {
    fileNames = await fs.readdir(inputDirPath)
  } catch (error) {
    console.error(
      "Could not read the 'input-txt' directory from the project root. Please ensure it exists.",
      error
    )
  }
  const exampleFiles: StoryFile[] = fileNames
    .filter((name) => name.endsWith(".txt"))
    .map((name) => ({
      key: name,
      label: name
        .replace(".txt", "")
        .replace(/-/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase()),
    }))

  return <HomePage initialFiles={exampleFiles} />
}
