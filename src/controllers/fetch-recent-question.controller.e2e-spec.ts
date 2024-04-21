import { INestApplication } from "@nestjs/common"
import { beforeAll, describe, expect, test } from "vitest"
import { Test } from '@nestjs/testing'
import { AppModule } from "@/app.module"
import request from 'supertest'
import { PrismaService } from "@/prisma/prisma.service"
import { hash } from 'bcryptjs'
import { JwtService } from "@nestjs/jwt"

describe('Fetch recent question (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()
    prisma = moduleRef.get(PrismaService)
    jwt = moduleRef.get(JwtService)

    await app.init()
    
  })

  test('[POST] /questions', async () => {
    const user = await prisma.user.create({
      data: {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: await hash('123456', 6)
      }
    })

    const accessToken = jwt.sign({ sub: user.id })

    await prisma.question.createMany({
      data: [
        {
          title: 'Question 1',
          content: 'question content 1',
          slug: 'question-1',
          authorId: user.id
        },
        {
          title: 'Question 2',
          content: 'question content 2',
          slug: 'question-2',
          authorId: user.id
        },
      ]
    })

    const response = await request(app.getHttpServer())
      .get('/questions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send()

    expect(response.statusCode).toBe(200)
    expect(response.body).toEqual({
      questions: [
        expect.objectContaining({ title: 'Question 1' }),
        expect.objectContaining({ title: 'Question 2' })
      ] 
    })
  })
})