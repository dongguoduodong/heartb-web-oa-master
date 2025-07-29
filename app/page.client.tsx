"use client"
import { Snippet } from "@nextui-org/snippet"
import { Code } from "@nextui-org/code"
import { Select, SelectItem, useDisclosure } from "@nextui-org/react"
import React, { useState, useCallback, useMemo } from "react"
import { getStoryContent, saveStoryContent } from "./actions/storyActions"
import {
  parseTxtToChapters,
  renumberChapters,
  splitChapter,
  reconstructTxtFromChapters,
  parseChapterNumber,
  createNewChapter,
} from "@/lib/story"
import { title } from "@/components/primitives"
import { useSerialCallback } from "./hooks/useSerialCallback"
import type { Story, Chapter } from "@/types/story"
import { ChapterList } from "./components/ChapterList"
import { ChapterEditor } from "./components/ChapterEditor"
import { SaveConfirmationModal } from "./components/SaveConfirmationModal"
import { toast } from "sonner"

interface HomeProps {
  initialFiles: { key: string; label: string }[]
}

const defaultChapters: Chapter[] = [createNewChapter('Chapter 1')]

export default function Home({ initialFiles }: HomeProps) {
  const [activeStory, setActiveStory] = useState<Story | null>(null)
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    null
  )
  const [history, setHistory] = useState<Chapter[][]>([])
  const [future, setFuture] = useState<Chapter[][]>([])
  const { isOpen, onOpen, onClose } = useDisclosure()

  const selectedChapter = useMemo(() => {
    return activeStory?.chapters.find((c) => c.id === selectedChapterId) || null
  }, [activeStory, selectedChapterId])

  const updateChapters = useCallback(
    (
      newChapters: Chapter[],
      options: {
        recordHistory?: boolean
        renumber?: boolean
        startNumOverride?: number | null
      } = {}
    ) => {
      const {
        recordHistory = true,
        renumber = true,
        startNumOverride = null,
      } = options

      if (!activeStory) return

      const chaptersToSet = renumber
        ? renumberChapters(newChapters, { startNumOverride })
        : newChapters

      if (recordHistory) {
        setHistory((prev) => [...prev, activeStory.chapters])
        setFuture([])
      }

      setActiveStory((prev) =>
        prev ? { ...prev, chapters: chaptersToSet } : null
      )
    },
    [activeStory]
  )

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    const previousState = history[history.length - 1]
    const newHistory = history.slice(0, history.length - 1)
    if (activeStory) setFuture((prev) => [activeStory.chapters, ...prev])
    setHistory(newHistory)
    updateChapters(previousState, {
      recordHistory: false,
    })
  }, [history, activeStory, updateChapters])

  const handleRedo = useCallback(() => {
    if (future.length === 0) return
    const nextState = future[0]
    const newFuture = future.slice(1)
    if (activeStory) setHistory((prev) => [...prev, activeStory.chapters])
    setFuture(newFuture)
    updateChapters(nextState, {
      recordHistory: false,
    })
  }, [future, activeStory, updateChapters])

  const handleStorySelect = useSerialCallback(
    async (fileNameKey: React.Key) => {
      const fileName = fileNameKey.toString()
      if (!fileName) return

      setActiveStory(null)
      setSelectedChapterId(null)
      setHistory([])
      setFuture([])
      try {
        const text = await getStoryContent(fileName)
        let chapters = parseTxtToChapters(text)
        if (chapters.length === 0) {
          chapters = [createNewChapter("Chapter 1")]
        }
        setActiveStory({
          id: crypto.randomUUID(),
          fileName,
          chapters: chapters,
        })
        if (chapters.length > 0) setSelectedChapterId(chapters[0].id)
      } catch (error) {
        console.error("Failed to load or parse story:", error)
        alert((error as Error).message)
      }
    }
  )

  const handleChapterSelect = (chapterId: string) =>
    setSelectedChapterId(chapterId)

  const handleContentChange = (newContent: string) => {
    if (!activeStory || !selectedChapterId) return

    const updatedChapters = activeStory.chapters.map((chapter) =>
      chapter.id === selectedChapterId
        ? { ...chapter, content: newContent }
        : chapter
    )
    updateChapters(updatedChapters, {
      renumber: false,
    })
  }

  const handleFinalizeSplit = useCallback(() => {
    if (!activeStory || !selectedChapter) return

    const newChapters = splitChapter(selectedChapter, activeStory.chapters)

    if (newChapters === activeStory.chapters) return

    updateChapters(newChapters)
  }, [activeStory, selectedChapter, updateChapters])

  const handleMergeWithNext = (chapterId: string) => {
    if (!activeStory) return
    const currentIndex = activeStory.chapters.findIndex(
      (c) => c.id === chapterId
    )
    if (currentIndex === -1 || currentIndex >= activeStory.chapters.length - 1)
      return
    const currentChapter = activeStory.chapters[currentIndex]
    const nextChapter = activeStory.chapters[currentIndex + 1]
    const mergedChapter: Chapter = {
      ...currentChapter,
      content: `${currentChapter.content}\n\n${nextChapter.content}`,
    }
    const updatedChapters = activeStory.chapters.filter(
      (c) => c.id !== nextChapter.id
    )
    updatedChapters[currentIndex] = mergedChapter
    updateChapters(updatedChapters)
  }

  const handleDeleteChapter = (chapterId: string) => {
    if (!activeStory) return

    const chapterIndex = activeStory.chapters.findIndex(
      (c) => c.id === chapterId
    )

    if (chapterIndex === -1) return

    const isFirstChapter = chapterIndex === 0
    let startNumOverride: number | null = null

    if (isFirstChapter && activeStory.chapters.length > 0) {
      const chapterToDelete = activeStory.chapters[chapterIndex]
      const parsed = parseChapterNumber(chapterToDelete.title)
      if (parsed.num !== null) {
        startNumOverride = parsed.num
      }
    }

    const updatedChapters = activeStory.chapters.filter(
      (c) => c.id !== chapterId
    )

    if (selectedChapterId === chapterId) {
      if (updatedChapters.length === 0) {
        setSelectedChapterId(null)
      } else if (chapterIndex > 0) {
        setSelectedChapterId(updatedChapters[chapterIndex - 1].id)
      } else {
        setSelectedChapterId(updatedChapters[0].id)
      }
    }
    updateChapters(updatedChapters, { startNumOverride })
  }

  const handleConfirmFinalize = useSerialCallback(async () => {
    if (!activeStory) return

    try {
      const fullText = reconstructTxtFromChapters(activeStory.chapters)
      await saveStoryContent(activeStory.fileName, fullText)
      onClose()
      toast.success(`[SUCCESS] Story "${activeStory.fileName}" saved.`)
    } catch (error) {
      console.error("Failed to save the story:", error)
      toast.error(`[ERROR] Failed to save "${activeStory.fileName}".`)
    }
  })

  const handleFinishImport = () => {
    if (activeStory) {
      onOpen()
    }
  }

  return (
    <section className='flex flex-col items-center justify-center gap-4 py-8 md:py-10'>
      <div className='inline-block max-w-xl text-center justify-center'>
        <span className={title()}>Place your changes here</span>
      </div>
      <div className='mt-8 gap-16'>
        <Snippet hideCopyButton hideSymbol className='gap-4' variant='bordered'>
          <span>
            Get started by editing <Code color='primary'>app/page.tsx</Code>
          </span>
          <span>Please feel free to use the example components below.</span>
        </Snippet>
      </div>
      <div className='pt-6 w-48'>
        <Select
          items={initialFiles}
          label='Story'
          placeholder='Select a story'
          onChange={(e) => handleStorySelect(e.target.value)}
          disabledKeys={activeStory ? [activeStory.fileName] : []}
        >
          {(story) => <SelectItem key={story.key}>{story.label}</SelectItem>}
        </Select>
      </div>

      <div className='pt-6'>
        <div className='flex flex-row'>
          <ChapterList
            isLoading={handleStorySelect.isBusy()}
            chapters={activeStory?.chapters || defaultChapters}
            selectedChapterId={selectedChapterId}
            onChapterSelect={handleChapterSelect}
            onMergeWithNext={handleMergeWithNext}
            onDeleteChapter={handleDeleteChapter}
          />
          <ChapterEditor
            isLoading={handleStorySelect.isBusy()}
            chapter={selectedChapter}
            onContentChange={handleContentChange}
            onFinalizeSplit={handleFinalizeSplit}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={history.length > 0}
            canRedo={future.length > 0}
            onFinishImport={handleFinishImport}
          />
        </div>
      </div>
      <SaveConfirmationModal
        isOpen={isOpen}
        onClose={onClose}
        activeStory={activeStory}
        handleConfirmFinalize={handleConfirmFinalize}
      />
    </section>
  )
}
