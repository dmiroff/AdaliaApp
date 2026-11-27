# Перенос публичной VPS Адалии

Инвентаризация 27 ноября 2026. Публичная VPS на Ubuntu 22.04 принимает HTTPS для
`adaliagame.ru`, `www.adaliagame.ru` и `test.adaliagame.ru`. На ней лежат
сборки сайта и работают nginx и входящий SSH. Бот, PostgreSQL, Redis и процессы
API остаются на игровой машине. На новую VPS поднимаются параллельные туннели
к тем же процессам.

| Маршрут | На публичной VPS | На игровой машине |
| --- | --- | --- |
| Основной сайт и www | `/var/www/adalia-production/current` | |
| Тестовый сайт | `/var/www/adalia-test/current` | |
| `/api/` на всех трёх доменах | `127.0.0.1:7001` | Основной API, `127.0.0.1:7000` |
| `/navyi/` на тестовом домене | `127.0.0.1:7003` | API зеркала, `127.0.0.1:7002` |

На момент проверки все три записи A у регистратора имели TTL 86 400 секунд.
Записей AAAA не было. Старая VPS имеет 1 vCPU, около 1 ГБ памяти, диск 20 ГБ и
2,8 ГБ свободного места. Во время выкладки ожидание диска достигало 97–98%
по Linux PSI. Это объясняет задержки той выкладки. Причину периодических
сетевых обрывов по этой проверке установить нельзя.

Для такого состава подойдёт отдельная Ubuntu 24.04 LTS с публичным IPv4.
Для текущих сборок и запаса под релизы заложены 2 vCPU, 2 ГБ RAM и от 40 ГБ SSD
или NVMe. Нужны консоль в панели провайдера, SSH по ключу с sudo для установки
и доступ к DNS зоны `adaliagame.ru`. На новой VPS открываются TCP 80 и 443,
а доступ к SSH нужен с машины выкладки и с игровой машины. Порты 7001 и 7003
слушают только loopback.

## Подготовить новую VPS

1. Проверьте отпечаток нового SSH-хоста через консоль провайдера. На машине
   выкладки подготовьте SSH-алиасы `adalia-old` и `adalia-new` для пользователя
   `adalia-deploy`. Игровая машина использует отдельный ключ туннеля. Закрытые
   ключи остаются на тех машинах, для которых созданы. На VPS передаются только
   публичные ключи.
2. Скопируйте каталог `deploy/vps` на новую машину и выполните в нём:

   ```bash
   sudo bash bootstrap.sh /path/to/deploy.pub /path/to/tunnel.pub
   ```

   Скрипт устанавливает пакеты, создаёт каталоги релизов и два SSH-аккаунта,
   проверяет настройки sshd и запускает HTTP-конфигурацию nginx. У
   `adalia-tunnel` разрешены только обратные перенаправления на два нужных
   loopback-порта. [OpenSSH](https://man.openbsd.org/sshd_config.5)
3. Выпустите два сертификата на новой VPS через DNS-01. Записи A на этом
   этапе продолжают указывать на старую VPS. Certbot покажет TXT-записи для
   регистратора. [Let’s Encrypt](https://letsencrypt.org/docs/challenge-types/#dns-01-challenge)

   ```bash
   sudo certbot certonly --manual --preferred-challenges dns --cert-name adaliagame.ru -d adaliagame.ru -d www.adaliagame.ru
   sudo certbot certonly --manual --preferred-challenges dns --cert-name test.adaliagame.ru -d test.adaliagame.ru
   sudo bash bootstrap.sh tls
   ```

4. С машины выкладки скопируйте только два активных релиза. Скрипт фиксирует
   пути исходных релизов, сверяет файлы входа и публикует оба на новой VPS после
   загрузки. Учитываются относительные ссылки на изображения внутри сборок.
   Для промежуточных копий на машине выкладки нужно около 2 ГБ свободного места.

   ```bash
   bash deploy/vps/copy-releases.sh adalia-old adalia-new
   ```

   При нестабильной связи запустите скрипт с `RELEASE_CACHE="$HOME/.cache/adalia-vps"`.
   При повторе он использует файлы, уже скачанные для того же релиза.
   Для основного сайта также подходит проверенная
   сборка опубликованного коммита `b9bbb1b`, если до переноса её не заменили
   последующим релизом. Для тестового сайта нужен его собственный релиз.
5. На игровой машине настройте `/etc/adalia/edge-ssh.conf` по приложенному
   шаблону и подставьте новый IPv4 вместо `NEW_IPV4`. Поместите проверенный
   публичный ключ нового SSH-хоста в `/etc/adalia/edge-known-hosts`. Приватный
   ключ клиента положите в `/etc/adalia/edge-tunnel.key` с режимом `0600` и
   владельцем, от имени которого будет работать сервис. В `User` передаётся имя
   существующего обычного пользователя этой машины, например отдельного
   сервисного пользователя `adalia-link`.

   ```bash
   sudo install -m 0644 deploy/vps/adalia-edge-tunnel@.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now adalia-edge-tunnel@adalia-link.service
   ```

   Оба туннеля работают параллельно старым. На новой VPS
   `ss -ltn` должен показывать `127.0.0.1:7001` и `127.0.0.1:7003`.

## Проверить и переключить

1. Заранее снизьте TTL трёх записей A, например до 300 секунд, и дайте прежним
   записям истечь. При исходном TTL 86 400 на это закладываются сутки. Сохраните
   старый IP для отката. Пока идёт переключение, договоритесь не публиковать
   разные версии сайта на двух VPS.
2. Проверьте новую VPS по IP с исходными именами доменов и проверкой TLS.
   Этот запрос проходит через новый nginx и новые туннели, независимо от
   публичного DNS.

   ```bash
   python3 deploy/vps/verify.py "$NEW_IPV4"
   ```

   Проверка требует загрузки SPA, JavaScript, карточки класса, PDF и ответов
   обоих туннелей. На основе `/api/` возвращает 200. Тестовый домен сейчас
   получает 403 на `/api/` от основного backend и 401 на
   `/navyi/api/access` без входа. Для проверки с учётной записью откройте
   тестовый сайт и основу через локальную подстановку IP для тех же доменов.
3. После успешной проверки поменяйте три записи A на новый IPv4. Проверьте
   ответ авторитетного DNS и повторите проверку через публичный DNS.

   ```bash
   python3 deploy/vps/verify.py
   ```

   Оставьте старую VPS и её туннели доступными на период распространения DNS
   и контрольного окна. При откате верните три записи A на прежний IP.
   Оба контура ведут к тем же игровым процессам и данным, поэтому перенос
   записей игроков при откате не требуется.
4. Когда публичный DNS указывает на новую VPS, переведите оба сертификата на
   автоматическое продление через HTTP-01. nginx уже отдаёт challenge из
   `/var/www/adalia-acme` на порту 80. Certbot проверит новый способ на staging
   перед сохранением. Установленный deploy hook перечитывает nginx после
   продления. [Руководство Certbot](https://eff-certbot.readthedocs.io/en/stable/using.html#modifying-the-renewal-configuration)

   ```bash
   sudo certbot reconfigure --cert-name adaliagame.ru --authenticator webroot --webroot-path /var/www/adalia-acme --preferred-challenges http
   sudo certbot reconfigure --cert-name test.adaliagame.ru --authenticator webroot --webroot-path /var/www/adalia-acme --preferred-challenges http
   sudo certbot renew --dry-run
   sudo systemctl enable --now certbot.timer
   ```

## Следующие выкладки

Для штатного `deploy.sh` задайте новый адрес через `SSH_HOST`. Параметр
`VERIFY_IP` направляет проверку HTTPS на новый IP даже до смены DNS.
После приёмки новой VPS создайте файл
`/var/www/adalia-production/.enabled` от root для будущих production-выкладок.

```bash
SSH_HOST="$NEW_IPV4" VERIFY_IP="$NEW_IPV4" ./deploy.sh test
```
