export interface Chapter {
  id: string
  title: string
  content: string
}

export interface Story {
  id: string
  fileName: string
  chapters: Chapter[]
}
