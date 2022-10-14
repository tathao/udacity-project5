export interface Todo {
  todoId: string
  createdAt: string
  name: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
}

export interface PagingTodo {
  items : Todo[],
  nextPage : string
}
