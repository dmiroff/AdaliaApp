#!/usr/bin/env sh

if [[ ! -d "/app/node_modules" ]]
then
  npm install && cat requirements.txt | xargs npm install -g
fi

npm run start
