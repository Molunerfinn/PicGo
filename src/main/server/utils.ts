export const handleResponse = ({
  response,
  statusCode = 200,
  header = {
    'Content-Type': 'application/json'
  },
  body = {
    success: false
  }
} : {
  response: IHttpResponse,
  statusCode?: number,
  header?: IObj,
  body?: any
}) => {
  response.writeHead(statusCode, header)
  response.write(JSON.stringify(body))
  response.end()
}
