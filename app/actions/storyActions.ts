"use server"

import fs from "fs/promises"
import path from "path"

function validateFileName(fileName: string) {
  if (fileName.includes("..") || fileName.includes("/")) {
    throw new Error("Invalid file name.")
  }
}

/**
 * 读取指定 story 的内容
 * @param fileName
 * @returns 文件内容的字符串
 */
export async function getStoryContent(fileName: string): Promise<string> {
  validateFileName(fileName)
  try {
    const filePath = path.join(process.cwd(), "input-txt", fileName)
    const content = await fs.readFile(filePath, "utf-8")
    return content
  } catch (error) {
    console.error(`Error reading file ${fileName}:`, error)
    throw new Error(
      `Could not read the story file. Please ensure '${fileName}' exists in the 'input-txt' directory.`
    )
  }
}

/**
 * 保存 story 内容到指定文件
 * @param fileName
 * @param content 新 story 内容字符串
 * @returns 操作结果
 */
export async function saveStoryContent(
  fileName: string,
  content: string
): Promise<{ success: boolean; error?: string }> {
  validateFileName(fileName)
  try {
    const filePath = path.join(process.cwd(), "input-txt", fileName)
    await fs.writeFile(filePath, content, "utf-8")
    console.log(
      `Successfully saved ${fileName} at ${new Date().toLocaleTimeString()}`
    )
    return { success: true }
  } catch (error) {
    console.error(`Error writing file ${fileName}:`, error)
    return { success: false, error: "Failed to save the file." }
  }
}

