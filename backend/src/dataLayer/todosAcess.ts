import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import * as uuid from 'uuid'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate';
import {PageTodoItem} from "../models/PageTodoItem";
const bucketName = process.env.ATTACHMENT_S3_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION
const XAWS = AWSXRay.captureAWS(AWS)
const s3 = new XAWS.S3({
    signatureVersion: 'v4'
})
// TODO: Implement the dataLayer logic
export class TodosAccess {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly toDoTable = process.env.TODOS_TABLE) {
    }

    async getTodosForUser(userId: String, limit: number, nextPage: any): Promise<PageTodoItem> {
        const params = {
            TableName: this.toDoTable,
            Limit: limit,
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            }}
        if (nextPage != undefined)
            params['ExclusiveStartKey'] = nextPage
        const result = await this.docClient.query(params).promise()

        const items = result.Items
        return{
            items: items as TodoItem[],
            nextPage: result.LastEvaluatedKey
        }
    }

    async createTodosForUser(todoItem: TodoItem): Promise<TodoItem> {
        await this.docClient.put({
            TableName: this.toDoTable,
            Item: todoItem
        }).promise()

        return todoItem as TodoItem
    }

    async deleteTodosForUser(todoIds: String, userId: String) {
        return await this.docClient.delete({
            TableName: this.toDoTable,
            Key: {
                userId: userId,
                todoId: todoIds
            }
        }).promise();
    }

    async updateTodosForUser(todoUpdate: TodoUpdate, userId: String, todoIds: String) {
        const params = {
            TableName: this.toDoTable,
            Key: {
                userId: userId,
                todoId: todoIds
            },
            UpdateExpression: 'set done = :r',
            ExpressionAttributeValues: {
                ':r': todoUpdate.done,
            }
        }
        return await this.docClient.update(params).promise();
    }

    async attachURL(todoId: string, userId: string) {
        const imageId = uuid.v4()
        const imageUrl = `https://${bucketName}.s3.amazonaws.com/${imageId}`
        await this.updateTodosImage(imageUrl, userId, todoId)
        const url = s3.getSignedUrl('putObject', {
            Bucket: bucketName,
            Key: imageId,
            Expires: Number(urlExpiration)
        })
        return url;
    }

    async updateTodosImage(imageUrl: String, userId: String, todoIds: String) {
        const params = {
            TableName: this.toDoTable,
            Key: {
                userId: userId,
                todoId: todoIds
            },
            UpdateExpression: 'set attachmentUrl = :r',
            ExpressionAttributeValues: {
                ':r': imageUrl,
            }
        }
        return await this.docClient.update(params).promise();
    }

    async parseLimitParam(event: any, limitDefault: number) {
        const limitStr = queryParameter(event, 'limit')
        if (!limitStr)
            return Promise.resolve(undefined)
        const limit = parseInt(limitStr, limitDefault)
        if (limit <= 0)
            throw new Error("The limitation must be greater than zero")
        return limit
    }

    async parseNextPage(event: any) {
        const nextPageStr = queryParameter(event,'nextPage')
        if(!nextPageStr)
            return Promise.resolve(undefined)
        const decodeURI = decodeURIComponent(nextPageStr)
        return JSON.parse(decodeURI)
    }
}

function queryParameter(event: any, name: string) {
    const query = event.queryStringParameters
    if(!query)
        return Promise.resolve(undefined)
    return query[name]
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
        console.log('Creating a local DynamoDB instance')
        return new XAWS.DynamoDB.DocumentClient({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
        })
    }

    return new XAWS.DynamoDB.DocumentClient()
}