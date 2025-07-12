import { Get, Path, Route } from 'tsoa'

export type HelloMessage = string

@Route('hello')
export class HelloRouter {
  @Get('{name}')
  public async sayHello (
    @Path() name: string
  ): Promise<HelloMessage> {
    return `Hello ${name}`
  }
}
