"use client"
import React, { useEffect, useRef } from "react"
import { Chapter } from "@/types/story"
import {
  Button,
  Textarea,
  ScrollShadow,
  Tooltip,
  Skeleton,
} from "@nextui-org/react"
import { Icon } from "@iconify/react"
import { cn } from "@/components/cn"
import { CHAPTER_SPLIT_MARKER } from "@/lib/story"

interface ChapterEditorProps {
  chapter: Chapter | null
  onContentChange: (newContent: string) => void
  onFinalizeSplit: () => void
  onFinishImport: () => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
  isLoading: boolean
}

export const ChapterEditor: React.FC<ChapterEditorProps> = ({
  chapter,
  onContentChange,
  onFinalizeSplit,
  onFinishImport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isLoading,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // 当章节切换时，重置滚动条到顶部
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0
    }
  }, [chapter?.id])

  const isChapterLoaded = !!chapter
  const displayTitle = isChapterLoaded ? chapter.title : "Chapter 1 - Blank"
  const editorContent = isChapterLoaded ? chapter.content : ""
  const isSplitDisabled =
    !isChapterLoaded || !editorContent.includes(CHAPTER_SPLIT_MARKER)

  const handleInsertMarker = () => {
    if (!textareaRef.current || !isChapterLoaded) return

    const { selectionStart, value } = textareaRef.current
    const marker = `\n${CHAPTER_SPLIT_MARKER}\n`
    const newContent =
      value.slice(0, selectionStart) + marker + value.slice(selectionStart)

    onContentChange(newContent)

    setTimeout(() => {
      textareaRef.current?.focus()
      const newCursorPos = selectionStart + marker.length
      textareaRef.current!.selectionStart = newCursorPos
      textareaRef.current!.selectionEnd = newCursorPos
    }, 0)
  }

  return (
    <div className='w-full flex flex-1 flex-col min-w-[600px] pl-4 gap-2'>
      <header className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <Button isIconOnly size='sm' variant='light'>
            <Icon
              className='hideTooltip text-default-500'
              height={24}
              icon='solar:sidebar-minimalistic-outline'
              width={24}
            />
          </Button>
          {isLoading ? (
            <Skeleton className='h-6 w-48 rounded-lg' />
          ) : (
            <h2
              className={cn(
                "text-md",
                !isChapterLoaded ? "text-default-400" : ""
              )}
            >
              {displayTitle}
            </h2>
          )}
        </div>
        <Button
          onPress={onFinishImport}
          isDisabled={!isChapterLoaded}
          startContent={<Icon icon='material-symbols:cloud-done' />}
        >
          Finish Import
        </Button>
      </header>
      <div className='w-full flex-1 flex-col min-w-[400px]'>
        <div className='flex flex-col gap-4 h-full'>
          <div className='flex flex-col items-start h-full'>
            <div className='relative w-full min-h-[400px] h-full bg-[#F4F4F5]  dark:bg-gray-300 rounded-lg'>
              <div className='absolute inset-x-4 top-4 z-10 flex justify-between items-center'>
                <div className='flex justify-between'>
                  <div className='flex items-center gap-2'>
                    <Button
                      size='sm'
                      onPress={handleInsertMarker}
                      isDisabled={!isChapterLoaded}
                      variant='light'
                      className='bg-white data-[hover=true]:bg-default/40 dark:bg-gray-700 dark:text-black'
                      startContent={
                        <Icon icon='fluent:insert-20-filled' width={20} />
                      }
                    >
                      Insert chapter split
                    </Button>
                    <Tooltip content='Undo' isDisabled={!canUndo}>
                      <Button
                        size='sm'
                        onPress={onUndo}
                        className='bg-white data-[hover=true]:bg-default/40 dark:bg-gray-700 dark:text-black'
                        isDisabled={!canUndo}
                        variant='light'
                        startContent={
                          <Icon
                            icon='solar:undo-left-round-line-duotone'
                            width={20}
                          />
                        }
                      >
                        Undo
                      </Button>
                    </Tooltip>
                    <Tooltip content='Redo' isDisabled={!canRedo}>
                      <Button
                        size='sm'
                        onPress={onRedo}
                        className='bg-white data-[hover=true]:bg-default/40 dark:bg-gray-700 dark:text-black'
                        isDisabled={!canRedo}
                        variant='light'
                        startContent={
                          <Icon
                            icon='solar:undo-right-round-line-duotone'
                            width={20}
                          />
                        }
                      >
                        Redo
                      </Button>
                    </Tooltip>
                  </div>
                </div>

                <Button
                  className='mr-2 bg-white dark:bg-gray-700 dark:text-black'
                  size='sm'
                  isDisabled={isSplitDisabled}
                  startContent={
                    <Icon
                      className='text-default-500'
                      icon='ph:split-vertical-light'
                      width={20}
                    />
                  }
                  onPress={onFinalizeSplit}
                  variant='flat'
                >
                  Split
                </Button>
              </div>
              <div>
                <ScrollShadow className='editScrollShow absolute left-0 right-0 bottom-10 top-12 text-base p-3 resize-none rounded-lg border-solid border-inherit bg-[#F4F4F5] dark:bg-gray-300'>
                  <div className='flex w-full h-full bg-slate-50 dark:bg-gray-200 rounded-lg'>
                    <Textarea
                      isDisabled={!isChapterLoaded}
                      ref={textareaRef}
                      aria-label='Chapter Content'
                      disableAutosize
                      value={editorContent}
                      onValueChange={onContentChange}
                      classNames={{
                        input: "!h-full",
                        inputWrapper:
                          "!h-full border-none shadow-none bg-transparent !rounded-lg",
                      }}
                    />
                  </div>
                </ScrollShadow>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
