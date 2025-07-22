# Times10 Time Tracker

A modern time tracking application built with Astro, React, and PostgreSQL. Focus on simple, efficient time entry with flexible duration formats.

## 🕐 Time Entry Features

The application now supports simple time entry with various duration formats:

- **Hours**: `2h`, `2hr`, `3.5hr`, `2hours`
- **Minutes**: `30m`, `30min`, `90minutes`
- **Seconds**: `3600s`, `5400sec`
- **Time format**: `4:15`, `1:30:45`
- **Decimal hours**: `2.5` (assumes hours)

### Quick Time Entry

Enter time as simply as typing `2h` or `3.5hr` - no need to worry about start and end times. The system focuses on the amount of time spent on each task.

## 🚀 Project Structure

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
├── src/
│   └── pages/
│       └── index.astro
└── package.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

Any static assets, like images, can be placed in the `public/` directory.

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
