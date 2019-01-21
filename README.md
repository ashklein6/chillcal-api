# ChillCal-API

This repository is the server for the ChillCal React-Native Application:

ChillCal is an anti-calendar application that focuses on free time rather than busy time. A connection-based app, users enter in times where they are available and their friends may request to “chill” during those times. Complete with a wintry, penguin theme, ChillCal will be a clean, easy-to-follow web-based mobile application.

## Built With

JavaScript, Node.js, React, React-Native, Redux, Saga, Expo, PostgreSQL, Passport

This app was tested and developed on an iPhone 6s. Though it should boot on Android, the functionality and UI may not work as expected.

## Features

### Completed

- [x] Users can create an account
- [x] Users can search for friends and send connection requests
- [x] Users can accept or decline connection requests
- [x] Users can create chills and edit their created chills
- [x] Users can view friend's open chills and request to chill
- [x] Users can accept or decline chill requests
- [x] Users can view their scheduled chills
- [x] Users can cancel a scheduled chill or a chill request

### Next Steps

- [ ] Implement calendar view for chills
- [ ] Implement message feature to discuss chill details

## Getting Started

### Prerequisites

Before you get started, make sure you have the following software installed on your computer:

- [Node.js](https://nodejs.org/en/)
- [PostrgeSQL](https://www.postgresql.org/)
- [Postico](https://eggerapps.at/postico/) 
- [NPM](https://www.npmjs.com/)
- [Expo](https://expo.io/)

### Installing

To get a copy of chillcal running on your local machine:

1. Follow steps of chillcal project to set up client.
1. Download this project.
1. Start postgres if not running already by using `brew services start postgresql`.
1. Create a new database called `chillcal` and create tables using the `chillcal-queries.sql` file. Specifically, run the statements in the `Create Tables` section. If you would like to name your database something else, you will need to change `chillcal` to the name of your new database name in `server/modules/pool.js`. If desired, run the statements in the `Dummy Data` section to fill the database with sample data.
1. Install node modules using `npm install`.
1. Create a `.env` file at the root of the project and paste these lines into the file:
    ```
    SERVER_SESSION_SECRET=superDuperSecret
    ```
    While you're in your new `.env` file, take the time to replace `superDuperSecret` with some long random string like `25POUbVtx6RKVNWszd9ERB9Bb6` to keep your application secure. Here's a site that can help you: [https://passwordsgenerator.net/](https://passwordsgenerator.net/). If you don't do this step, create a secret with less than eight characters, or leave it as `superDuperSecret`, you will get a warning.
1. Start server with `npm run server` in one terminal.

### Lay of the Land

* `server/` contains the Express application

## Authors

* Ashley Klein

## Acknowledgments

* Prime Digital Academy for starter code with Passport
