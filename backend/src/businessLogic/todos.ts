import { TodoItem } from '../models/TodoItem';
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import * as uuid from 'uuid'
import { TodosAccess } from '../dataLayer/todosAcess';
import {PageTodoItem} from "../models/PageTodoItem";

const todosAccess = new TodosAccess();

// TODO: Implement businessLogic
export const getTodosForUser = async (userId: String, limit: number, nextPage: any): Promise<PageTodoItem> => {
    return todosAccess.getTodosForUser(userId, limit, nextPage);
}

export async function createTodo(
    createTodoRequest: CreateTodoRequest,
    userId: string
): Promise<TodoItem> {

    const todoId = uuid.v4()

    return await todosAccess.createTodosForUser({
        userId: userId,
        todoId: todoId,
        createdAt: new Date().toISOString(),
        name: createTodoRequest.name,
        dueDate: createTodoRequest.dueDate,
        done: false,
        attachmentUrl: ""
    })
}

export async function deleteTodo(todoId: string, userId: string) {
    // TODO: Implement validate todoItem exist in DB
    return await todosAccess.deleteTodosForUser(todoId, userId)
}

export async function updateTodo(updateTodoRequest: UpdateTodoRequest, todoId: string, userId: string) {
    return await todosAccess.updateTodosForUser(updateTodoRequest, userId, todoId)
}

export async function attachURL(todoId: string, userId: string) {
    return await  todosAccess.attachURL(todoId, userId)
}

export async function parseLimitParam(event: any, limitDefault: number) {
    return await todosAccess.parseLimitParam(event, limitDefault)
}

export async function parseNextPageParam(event: any) {
    return await todosAccess.parseNextPage(event)
}
export function encodeNextPage(lastEvaluateKey: any) {
    if (!lastEvaluateKey)
        return null
    return encodeURIComponent(JSON.stringify(lastEvaluateKey))
}

