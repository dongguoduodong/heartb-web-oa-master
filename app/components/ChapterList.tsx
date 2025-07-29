"use client"
import React from "react"
import { Chapter } from "@/types/story"
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  ScrollShadow,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Skeleton,
  Spacer,
} from "@nextui-org/react"
import { Icon } from "@iconify/react"
import { cn } from "@/components/cn"

interface ChapterListProps {
  isLoading: boolean
  chapters: Chapter[]
  selectedChapterId: string | null
  onChapterSelect: (chapterId: string) => void
  onMergeWithNext: (chapterId: string) => void
  onDeleteChapter: (chapterId: string) => void
}

export const ChapterList: React.FC<ChapterListProps> = ({
  isLoading,
  chapters,
  selectedChapterId,
  onChapterSelect,
  onMergeWithNext,
  onDeleteChapter,
}) => {
  const renderHeader = () => (
    <header className='flex items-center text-md font-medium text-default-500 group-data-[selected=true]:text-foreground'>
      <Icon
        className='text-default-500 mr-2'
        icon='solar:clipboard-text-outline'
        width={24}
      />
      Chapters
    </header>
  )
  if (isLoading) {
    return (
      <div
        className='relative flex h-full w-96 max-w-[384px] flex-1 flex-col !border-r-small border-divider pr-6 transition-[transform,opacity,margin] duration-250 ease-in-out'
      >
        {renderHeader()}
        <div className='flex flex-col gap-4 py-3 pr-4'>
          {[1, 2, 3].map((n) => (
            <Card key={n} className='p-4 h-24' shadow='none'>
              <Skeleton className='rounded-lg'>
                <div className='h-7 rounded-lg bg-default-300'></div>
              </Skeleton>
              <Spacer y={3} />
              <Skeleton className='rounded-lg'>
                <div className='h-8 w-4/5 rounded-lg bg-default-300'></div>
              </Skeleton>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className='relative flex h-full w-96 max-w-[384px] flex-1 flex-col !border-r-small border-divider pr-6 transition-[transform,opacity,margin] duration-250 ease-in-out'
      id='menu'
    >
      {renderHeader()}
      <ScrollShadow className='max-h-[calc(500px)] -mr-4' id='menu-scroll'>
        <div className='flex flex-col gap-4 py-3 pr-4'>
          {chapters.map((chapter, index) => {
            const isSelected = chapter.id === selectedChapterId

            return (
              <Card
                key={chapter.id}
                isPressable
                onPress={() => onChapterSelect(chapter.id)}
                shadow='none'
                className={cn(
                  "border-1 border-divider/15",
                  isSelected &&
                    "bg-primary-50 border-primary dark:bg-primary/10"
                )}
              >
                <CardHeader className='flex items-center justify-between pt-2 pb-2'>
                  <div className='flex gap-1.5 flex-1 overflow-hidden'>
                    {isSelected && (
                      <Chip
                        className='mr-1'
                        color='primary'
                        radius='sm'
                        size='sm'
                        variant='flat'
                      >
                        Editing
                      </Chip>
                    )}
                    <p className='text-sm font-medium text-left truncate'>
                      {chapter.title}
                    </p>
                  </div>
                  <div onClick={(e) => e.stopPropagation()}>
                    <Dropdown>
                      <DropdownTrigger>
                        <div className='p-1 rounded-small hover:bg-default-200 dark:hover:bg-default-100 cursor-pointer'>
                          <Icon
                            icon='solar:menu-dots-bold'
                            width={20}
                            className='text-default-500'
                          />
                        </div>
                      </DropdownTrigger>
                      <DropdownMenu
                        aria-label='Chapter Actions'
                        disabledKeys={
                          index === chapters.length - 1 ? ["merge"] : []
                        }
                      >
                        <DropdownItem
                          key='merge'
                          startContent={
                            <Icon
                              icon='solar:add-to-queue-line-duotone'
                              width={18}
                            />
                          }
                          onPress={() => onMergeWithNext(chapter.id)}
                        >
                          Combine with next chapter
                        </DropdownItem>
                        <DropdownItem
                          key='delete'
                          className='text-danger'
                          color='danger'
                          startContent={
                            <Icon
                              icon='solar:trash-bin-trash-line-duotone'
                              width={18}
                            />
                          }
                          onPress={() => onDeleteChapter(chapter.id)}
                        >
                          Delete this chapter
                        </DropdownItem>
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </CardHeader>
                <Divider />
                <CardBody className='pt-2 pb-2'>
                  <p className='text-xs text-default-600 line-clamp-2'>
                    {chapter.content}
                  </p>
                </CardBody>
              </Card>
            )
          })}
        </div>
      </ScrollShadow>
    </div>
  )
}
