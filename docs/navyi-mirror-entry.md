# Навьи тропы на зеркале

Пункт меню доступен на test.adaliagame.ru после обычного входа. NavBar запрашивает /navyi/api/access с существующим JWT: сервер читает актуальный Player.is_admin из базы зеркала. ID не зашит в клиент. На основном сайте пункт и запрос отсутствуют. Сервер игры самостоятельно проверяет права на каждом запросе; скрытие кнопки не является защитой.

На компьютере пункт находится в верхнем меню; на телефоне — «Ещё → Навьи тропы». Переход выполняет полную загрузку /navyi/, поскольку там работает отдельный клиент, а не маршрут SPA Адалии.

Проверки без необязательных jest-dom matchers старого setupTests.js:

    CI=true node node_modules/react-scripts/bin/react-scripts.js test --watchAll=false --runInBand --setupFilesAfterEnv=./scripts/test/navyi-jest-setup.cjs --runTestsByPath src/components/NavBarNavyi.test.js
