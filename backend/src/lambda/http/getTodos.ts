import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler  } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';

import { createLogger } from '../../utils/logger'

const logger  = createLogger("getTodos");
// TODO: Get all TODO items for a current user
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    // Write your code here
    try {
      const userId = getUserId(event)
      const todos = await getTodosForUser(userId);
      logger.info("Get Todo by user ", userId);

      return {
        statusCode: 200,
        body: JSON.stringify({
          "items": todos
        })
      };
    } catch (error) {
      logger.error('Cannot get todo by user caused by: ', { error: error.message })
      return {
        statusCode: 500,
        body: JSON.stringify({
          "message": "Internal server error"
        })
      }
    }
  })

handler
  .use(httpErrorHandler())
  .use(
  cors({
    credentials: true
  })
)
