# My-bank API Service

  <p align="center">A nest.js API to safe your money :D</p>
    <p align="center">

  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

This is a answer about a test guide to a company

## Requisites

- Node.js
- PostgreSQL (docker-compose available :)

## Installation

```bash
$ npm install
```

## Setup `.env` configuration file

There is a file `.env.example` with all variables to use, create a `.env` file like that:

```bash
DATABASE_URL="postgresql://userrap:la4Yb01ma@localhost:5432/my-bank?schema=public"
JWT_SECRET="my-secret-credential"
```

## Running the app

```bash
# development
$ npm run start 

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## OpenAPI documentation

Go to broswer and navigate to `http://localhost:3000/api`

## License

Nest is [MIT licensed](LICENSE).
