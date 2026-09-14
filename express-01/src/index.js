import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import models, { sequelize } from './models/index.js';
import routes from './routes/index.js';

const app = express();

app.set('trust proxy', true);

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// middleware que logs
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// middleware de autenticação "fake" + injeção dos models no req.context
app.use(async (req, res, next) => {
  req.context = {
    models,
    me: await models.User.findByLogin('rwieruch'),
  };

  next();
});

// rotas
app.get('/', (req, res) => {
  return res.send('Servidor express exectuando...');
});

app.use('/session', routes.session);
app.use('/users', routes.user);
app.use('/messages', routes.message);

const port = process.env.PORT || 3000;

const eraseDatabaseOnSync =
  process.env.ERASE_DATABASE_ON_SYNC === 'true';

sequelize.sync({ force: eraseDatabaseOnSync }).then(async () => {
  if (eraseDatabaseOnSync) {
    createUsersWithMessages();
  }

  app.listen(port, () =>
    console.log(`Example app listening on port ${port}!`),
  );
});

const createUsersWithMessages = async () => {
  await models.User.create(
    {
      username: 'rwieruch',
      email: 'rwieruch@email.com',
      messages: [
        {
          text: 'Published the Road to learn React',
        },
      ],
    },
    {
      include: [models.Message],
    },
  );

  await models.User.create(
    {
      username: 'ddavids',
      email: 'ddavids@email.com',
      messages: [
        {
          text: 'Happy to release ...',
        },
        {
          text: 'Published a complete ...',
        },
      ],
    },
    {
      include: [models.Message],
    },
  );
};