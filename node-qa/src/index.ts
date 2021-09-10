import http from 'http'
import express, { Express } from 'express'
import morgan from 'morgan'
import session from 'express-session'
import routes from './routes/index'

const app: Express = express()

app.use(morgan('dev'))

// session middleware
app.use(session({
  secret: process.env.SECRET || 'my_session_secret',
  saveUninitialized: true,
  cookie: { maxAge: (1000 * 60 * 60 * 24), secure: 'auto' },
  resave: false
}))

app.use(express.urlencoded({ extended: false }))

app.use(express.json())

app.use('/', routes)

/** Error handling */
app.use((req, res, next) => {
  const error = new Error('not found')
  return res.status(404).json({
    message: error.message
  })
})

const httpServer = http.createServer(app)
const PORT: any = process.env.PORT ?? 3000
httpServer.listen(PORT, () => console.log(`The server is running on port ${PORT}`))
