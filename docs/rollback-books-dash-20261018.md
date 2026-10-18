# Откат основного веб-клиента до исправления книг и рывка

Сохранён релиз: `/var/www/adalia-production/releases/1792329859109171544`.
Независимый каталог резервной копии:
`/var/www/adalia-production/backups/before-books-dash-20261018-linked`.

Файлы сохранены жёсткими ссылками: резервная копия переживёт удаление
исходного каталога релиза. Деплой создаёт новые каталоги и не изменяет
содержимое уже сохранённых файлов. SHA256 index.html:
`2d0ec1b5f447ba60bb820a7f79f4a681b2f21e5089d6b47f7bc26579e30fd785`.

Переключить основной сайт обратно на эту копию:

```bash
ssh adalia-deploy@195.133.196.237 'test -f /var/www/adalia-production/backups/before-books-dash-20261018-linked/index.html && ln -sfn /var/www/adalia-production/backups/before-books-dash-20261018-linked /var/www/adalia-production/current.next && mv -Tf /var/www/adalia-production/current.next /var/www/adalia-production/current'
```

Это откат только веб-клиента. База данных и игровой API этой командой не меняются.
