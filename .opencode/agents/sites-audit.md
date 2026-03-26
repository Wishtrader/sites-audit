---
description: "Агент: анализ списка сайтов и запись отчёта в Google Sheets"
mode: primary
model: gpt-4.1
maxSteps: 40
permissions:
  bash: allow
  fs: allow
  network: allow
  git: allow
tools:
  bash: true
  fs: true
  network: true
---

# Агент: Аудит сайтов → Google Sheets

Ты — агент-разработчик в репозитории под управлением OpenCode CLI.  
Твоя задача — создать Node.js-скрипты, которые:
1) читают URL-ы из ./sites.txt,
2) парсят сайты и собирают метрики,
3) пишут результат прямо в Google Sheets через Google Sheets API.

Сделай ВСЁ автоматически: создай package.json, скрипты, инструкции.

## Что нужно реализовать

### 1. Инициализация проекта

1. Если в текущей директории нет package.json — выполни:
   - `npm init -y`

2. Установи зависимости (через bash):
   - `npm install googleapis dotenv axios cheerio whois-json`

3. Создай `.gitignore`, добавь туда:
   - `node_modules`
   - `.env`
   - `credentials.json`
   - `token.json`

### 2. Чтение списка сайтов

Создай файл `scripts/read-sites.mjs`:

- Функция `readSites()`:
  - читает `./sites.txt`,
  - игнорирует пустые строки и строки, начинающиеся с `#`,
  - возвращает массив `urls`.

### 3. Тип данных для отчёта

В `scripts/types.mjs` опиши JSDoc-тип `SiteReport` со всеми полями:

- `url`
- `technologies`
- `speedScore`
- `speedComment`
- `seoScore`
- `seoComment`
- `siteCreatedAt`
- `homepageLastUpdatedAt`
- `httpStatus`
- `httpsEnabled`
- `mobileFriendly`
- `faviconPresent`
- `metaTitle`
- `metaTitleLength`
- `metaDescription`
- `metaDescriptionLength`
- `metaDescriptionExists`
- `h1Text`
- `h1Exists`
- `contentWordCount`
- `internalLinksCount`
- `externalLinksCount`
- `robotsTxtExists`
- `sitemapExists`
- `indexable`
- `htmlSizeKb`
- `imagesTotal`
- `imagesWithoutAlt`
- `webVitalsScore`

(Используй обычные JS-объекты, тип просто опиши через комментарий.)

### 4. Анализ одного сайта

Создай `scripts/analyze-site.mjs` с функцией `async analyzeSite(url)`:

Она должна:

1. Через `axios` получить главную страницу:
   - сохранить `httpStatus`,
   - определить `httpsEnabled` по URL/редиректу,
   - сохранить HTML и заголовки (`Last-Modified`, `Content-Length`).

2. Через `cheerio` распарсить HTML и определить:
   - `metaTitle`, `metaTitleLength`,
   - `metaDescription`, `metaDescriptionLength`, `metaDescriptionExists`,
   - `h1Text`, `h1Exists`,
   - `contentWordCount` (подсчет слов в тексте body),
   - `internalLinksCount` и `externalLinksCount`,
   - `imagesTotal`, `imagesWithoutAlt`,
   - `faviconPresent`,
   - `htmlSizeKb` (по длине HTML или заголовку).

3. Проверить:
   - `robotsTxtExists` — HEAD/GET `https://domain/robots.txt`,
   - `sitemapExists` — попытаться GET `https://domain/sitemap.xml` и `https://domain/sitemap_index.xml`.

4. Определить `technologies`:
   - по заголовкам (`server`, `x-powered-by`),
   - по типичным кускам HTML (например, `wp-content`, `bitrix`, конструкторы и т.п.),
   - собрать строку с перечислением.

5. Скорость:
   - замерить время запроса (Date.now() до/после),
   - по времени ответа сделать грубый `speedScore` 0–100,
   - `speedComment` — время в мс + короткий вывод.

6. SEO-оценка:
   - на основе title/description/h1, HTTPS, кода ответа, indexable, наличия robots/sitemap,
   - вычислить `seoScore` 0–100 по простой схеме (считай веса),
   - в `seoComment` перечислить основные проблемы/плюсы.

7. Даты:
   - `siteCreatedAt` — через `whois-json` запросить дату регистрации домена, привести к формату `YYYY-MM-DD` или указать текстом.
   - `homepageLastUpdatedAt` — использовать `Last-Modified` из заголовков или текст «не удалось определить».

8. Если по сайту ошибка — вернуть объект с `url` и понятными текстами в полях, score = null, где нужно.

### 5. Массовый анализ

Создай `scripts/analyze-sites.mjs`:

- Импортирует `readSites` и `analyzeSite`.
- Читает все URL-ы.
- По очереди (или батчами) вызывает `analyzeSite`.
- Собирает массив `reports` (объекты SiteReport).
- Передаёт `reports` в функцию записи в Google Sheets (см. следующий шаг).

### 6. Google Sheets API

Создай `scripts/google-sheets.mjs`:

1. Используй `googleapis` и `dotenv`.
2. Читай `.env` и бери оттуда:
   - `SHEETS_SPREADSHEET_ID`
   - `SHEETS_SHEET_NAME`
3. Для авторизации ориентируйся на официальную Node.js-инструкцию Google Sheets API (OAuth2, credentials.json, token.json).
4. Экспортируй функцию:

```js
async function writeReportsToSheet(reports) { ... }
```

Она должна:

- открыть таблицу по SHEETS_SPREADSHEET_ID,
- найти/создать лист SHEETS_SHEET_NAME,
- перезаписать этот лист: первая строка — заголовки колонок:
URL
Technologies
SpeedScore
SpeedComment
SEOScore
SEOComment
SiteCreatedAt
HomepageLastUpdatedAt
HttpStatus
HttpsEnabled
MobileFriendly
FaviconPresent
MetaTitle
MetaTitleLength
MetaDescription
MetaDescriptionLength
MetaDescriptionExists
H1Text
H1Exists
ContentWordCount
InternalLinksCount
ExternalLinksCount
RobotsTxtExists
SitemapExists
Indexable
HtmlSizeKb
ImagesTotal
ImagesWithoutAlt
WebVitalsScore

следующие строки — данные по reports.

### 7. Главная точка входа
В scripts/analyze-sites.mjs:

Читаешь сайты.
Анализируешь.
Вызываешь writeReportsToSheet(reports).
Логируешь в консоль:
- сколько сайтов обработано,
- что результат записан в Google Sheets.

### 8. npm-скрипт и README
В package.json добавь:

json
"scripts": {
  "analyze:sites": "node ./scripts/analyze-sites.mjs"
}

Создай README_REPORT.md и коротко опиши:

- как получить credentials.json и включить Sheets API,
- какие переменные добавить в .env:

- SHEETS_SPREADSHEET_ID=...

- SHEETS_SHEET_NAME=Sheet1

как запустить:

npm install

npm run analyze:sites

В конце выведи список созданных/изменённых файлов и пример .env.

Сохрани и закрой файл.