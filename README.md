# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

## Deployment

For a deployment directly from the developer machine after making changes:

```bash
./deploy.sh test
```

The script builds the application, transfers only changed files over SSH,
switches the active release atomically, and checks the resulting page.

After the test site has been accepted and production deployment has been
enabled on the server, use `./deploy.sh production`. It requires typing
`deploy` before anything is uploaded.

## Черновой игровой чат

Маршрут `https://test.adaliagame.ru/play-draft` показывает клиент существующего бота. Маршрут и пункт меню доступны только на точном тестовом домене и localhost/127.0.0.1. Основной домен использует прежнюю маршрутизацию.

Вкладка «Игровой бот» использует текущую авторизацию приложения и отдельный namespace `/api/game`: получает серверную историю, картинки и клавиатуры, отправляет команды в существующий обработчик бота. Действия меняют настоящего персонажа на зеркале. При отсутствии нового API интерфейс явно сообщает, что канал ещё не включён.

Обычные клавиатуры остаются под перепиской; callback-кнопки отображаются у соответствующего сообщения. Сервер проверяет владельца, актуальность кнопки и исходный payload. Картинки загружаются с JWT. Повторная проверка отправки использует тот же UUID команды: потеря ответа не вызывает повторного игрового действия.

Вкладка «Демосценарий» работает в браузере: текст, изображения, обычные и callback-кнопки, короткий бой и история в `adalia.game-draft.v1`. Она не отправляет игровые команды серверу.

Подключение API и воспроизводимый браузерный e2e описаны в `VkBotGame/docs/deployment/game_web.md`. Новая игровая логика и миграции таблиц не нужны.
