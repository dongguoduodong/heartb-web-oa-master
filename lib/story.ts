import { Chapter } from "@/types/story"
import { toRoman, toArabic } from "roman-numerals"
import { toWords } from "number-to-words"
import { wordsToNumbers } from "words-to-numbers"

export const CHAPTER_SPLIT_MARKER = "=====SPLIT CHAPTER====="

type ChapterNumberFormat = "arabic" | "roman" | "word" | "unknown"

export const createNewChapter = (title: string, content: string = ""): Chapter => ({
  id: crypto.randomUUID(),
  title,
  content,
})

const isChapterTitleLine = (line: string): boolean => {
  const chapterTitleRegex =
    /^(Chapter\s+([IVXLCDM\d]+|[A-Za-z\-]+))((?:\s*[:\-—]\s*).*)?$/i
  const isMatch = chapterTitleRegex.test(line)
  const endsWithPunctuation = /[.?!]$/.test(line)

  return isMatch && !endsWithPunctuation
}

const isEndMarkerLine = (line: string): boolean => {
  const endMarkerRegex = /^(---|---CHAPTER END---)$/i
  return endMarkerRegex.test(line)
}

const getNumberFromString = (numStr: string): number | null => {
  const arabicNum = parseInt(numStr, 10)
  if (!isNaN(arabicNum) && arabicNum.toString() === numStr) {
    return arabicNum
  }
  try {
    return toArabic(numStr.toUpperCase())
  } catch (e) {
    // 命中默认情况
  }
  try {
    const wordNum = wordsToNumbers(numStr.toLowerCase())
    if (typeof wordNum === "number") return wordNum
  } catch (e) {
    // 命中默认情况
  }
  return null
}

const formatNumber = (num: number, format: ChapterNumberFormat): string => {
  switch (format) {
    case "roman":
      return toRoman(num)
    case "word":
      const word = toWords(num)
      return word.charAt(0).toUpperCase() + word.slice(1)
    case "arabic":
    default:
      return num.toString()
  }
}

export const parseChapterNumber = (
  title: string
): { num: number | null; format: ChapterNumberFormat; subtitle: string } => {
  const match = title.match(
    /^(?:Chapter\s+)([IVXLCDM\d]+|[A-Za-z\-]+)((?:\s*[:\-—]\s*).*)?$/i
  )

  if (!match) return { num: null, format: "unknown", subtitle: "" }

  const [, numberStr, subtitle = ""] = match
  const num = getNumberFromString(numberStr)

  let format: ChapterNumberFormat = "unknown"
  if (num !== null) {
    if (/^\d+$/.test(numberStr)) format = "arabic"
    else if (/^[IVXLCDM]+$/i.test(numberStr)) format = "roman"
    else format = "word"
  } else if (/^[A-Za-z\-]+$/.test(numberStr)) {
    format = "word"
  }

  return { num, format, subtitle }
}

export const parseTxtToChapters = (text: string): Chapter[] => {
  if (!text.trim()) {
    return []
  }

  const lines = text.split(/\r?\n/)
  const chapters: Chapter[] = []
  let currentContent: string[] = []
  let hasFoundFirstChapter = false

  for (const line of lines) {
    const trimmedLine = line.trim()
    if (isEndMarkerLine(trimmedLine)) continue

    if (isChapterTitleLine(trimmedLine)) {
      if (hasFoundFirstChapter && currentContent.length > 0) {
        chapters[chapters.length - 1].content = currentContent
          .join("\n")
          .trimEnd()
      } else if (!hasFoundFirstChapter && currentContent.length > 0) {
        const preContent = currentContent.join("\n").trim()
        if (preContent) {
          chapters.push(createNewChapter("Chapter 1", preContent + "\n"))
        }
      }
      chapters.push(createNewChapter(trimmedLine))
      currentContent = []
      hasFoundFirstChapter = true
    } else {
      currentContent.push(line)
    }
  }

  if (chapters.length > 0) {
    chapters[chapters.length - 1].content = currentContent.join("\n").trimEnd()
  } else if (text.trim()) {
    chapters.push(createNewChapter("Chapter 1", text.trimEnd()))
  }

  return chapters.filter((ch) => ch.title || ch.content)
}

export const reconstructTxtFromChapters = (chapters: Chapter[]): string => {
  return chapters
    .map((chapter) => `${chapter.title}\n\n${chapter.content}`)
    .join("\n\n\n")
}

const getChapterMetadata = (chapters: Chapter[]) => {
  return chapters.map((chapter) => {
    const { num, format, subtitle } = parseChapterNumber(chapter.title)
    return { ...chapter, originalNum: num, format, subtitle }
  })
}

const determineStartingNumber = (
  parsedChapters: any[],
  override: number | null | undefined
): number => {
  if (override != null) {
    return override
  }
  const validNumbers = parsedChapters
    .map((c) => c.originalNum)
    .filter((n): n is number => n !== null)

  return validNumbers.length > 0 ? Math.min(...validNumbers) : 1
}

const determineTargetFormat = (parsedChapters: any[]): ChapterNumberFormat => {
  const firstValidChapter = parsedChapters.find((c) => c.format !== "unknown")
  return firstValidChapter ? firstValidChapter.format : "arabic"
}

export const renumberChapters = (
  chapters: Chapter[],
  options: { startNumOverride?: number | null } = {}
): Chapter[] => {
  if (chapters.length === 0) {
    return []
  }

  const parsedChapters = getChapterMetadata(chapters)
  const startNumber = determineStartingNumber(
    parsedChapters,
    options.startNumOverride
  )
  const targetFormat = determineTargetFormat(parsedChapters)

  return parsedChapters.map((chapter, index) => {
    const newNumber = startNumber + index
    const newNumberStr = formatNumber(newNumber, targetFormat)
    const newTitle = `Chapter ${newNumberStr}${chapter.subtitle}`
    return { ...chapter, title: newTitle }
  })
}

const getCoreTitle = (title: string): string => {
  return title
    .replace(/^Chapter\s+([\dIVXLCDM]+|[A-Za-z\s]+)[\s\-—:]*/i, "")
    .replace(/\s-\s\d+$/i, "")
    .trim()
}

const findNextSubNumber = (
  coreTitleToMatch: string,
  allChapters: Chapter[]
): number => {
  const subNumbers = allChapters
    .filter((chapter) => getCoreTitle(chapter.title) === coreTitleToMatch)
    .map((chapter) => {
      const match = chapter.title.match(/\s-\s(\d+)$/i)
      return match ? parseInt(match[1], 10) : 1
    })

  return subNumbers.length > 0 ? Math.max(...subNumbers) + 1 : 1
}

export const splitChapter = (
  chapterToSplit: Chapter,
  allChapters: Chapter[]
): Chapter[] => {
  const contents = chapterToSplit.content
    .split(CHAPTER_SPLIT_MARKER)
    .map((c) => c.trim())

  if (contents.length <= 1) {
    return allChapters
  }

  const originalIndex = allChapters.findIndex((c) => c.id === chapterToSplit.id)
  if (originalIndex === -1) {
    return allChapters
  }

  const baseTitle = chapterToSplit.title.replace(/\s-\s\d+$/i, "").trim()
  const nextSubNum = findNextSubNumber(
    getCoreTitle(chapterToSplit.title),
    allChapters
  )

  const updatedOriginalChapter: Chapter = {
    ...chapterToSplit,
    content: contents[0],
  }

  const newChaptersToAdd: Chapter[] = contents
    .slice(1)
    .map((content, i) =>
      createNewChapter(`${baseTitle} - ${nextSubNum + i}`, content)
    )

  const resultChapters = [...allChapters]
  resultChapters.splice(
    originalIndex,
    1,
    updatedOriginalChapter,
    ...newChaptersToAdd
  )

  return resultChapters
}
