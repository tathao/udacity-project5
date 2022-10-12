import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { getUserId } from '../utils';
import { createTodo } from '../../businessLogic/todos'

import { createLogger } from '../../utils/logger'

const logger = createLogger("createTodo");
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

    try {
      const newTodo: CreateTodoRequest = JSON.parse(event.body)
      // TODO: Implement creating a new TODO item
      if(newTodo.name == "" || newTodo.name == null){
        return {
          statusCode: 422,
          body: JSON.stringify({
            "message": "Task cannot be empty"
          })
        }
      }
      const user = getUserId(event);
      const todo = await createTodo(newTodo,user)
      logger.info("Create todo succeess")
      return {
        statusCode: 201,
        body: JSON.stringify({
          "item": todo
        })
      }
    } catch (error) {
      logger.error("The todo can't created cause by: ", { error: error.message })
      return {
        statusCode: 500,
        body: JSON.stringify({
          "message": "Internal server error"
        })
      }
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
