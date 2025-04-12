# 🥇 TMStats

![Cover](https://raw.githubusercontent.com/Meldiron/tmstats/master/static/cover_tmstats.png)

## 👋 Introduction

TMStats is a medal tracker that shows overview of all Trackmania medals an user achieved. The website allows user to share campaign, weekly, or daily maps medals with anyone.

Project focuses on multiple aspects and features:

- [x] Track of the day (TOTD) medals
- [x] Campaign medals
- [x] Weekly shorts medals
- [ ] Custom map medals
- [ ] Gamified achievement & quests system

As of right now, project has no business model and is fully free and open-sourced. Project generates expenses, and business model may be added in the future.

## 🤖 Tech Stack

TMStats uses multiple frontend and backend technologies with focus of simplifying the development. Main focus of tech stack in this project is to make development fast and fun, instead of making it scalable and reliable.

- [TailwindCSS](https://tailwindcss.com/), a CSS library to rapidly design components using HTML classes
- [Svelte](https://svelte.dev/), a JS library to build reactive frontend. Alongside this, application uses [TypeScript](https://www.typescriptlang.org/)
- [Svelte Kit](https://kit.svelte.dev/), a Svelte framework to give proejct proper structure, routing and other cool features
- [Appwrite](https://appwrite.io/), a secure backend as a service that provides 90% of necessary backend functionality out of the box

## 💻 Development Setup

**Frontend:**

1. Install dependencies: `npm install`
2. Spin-up HTTP server: `npm run dev`
3. Visit [localhost:3000](http://localhost:3000/)

**Backend:**

> You only need to spin-up backend if you man on backend changes. For frontend changes, you can skip this step as project is connected to production backend instance.

1. Install [Appwrite](https://appwrite.io/docs/installation) locally, or on development server

> Make sure your `.env` file `_APP_FUNCTIONS_RUNTIMES` variable includes `deno-2.0` runtime. This runtime is used by all functions in this project. Changes to `.env` are applied using command `docker-compose up -d`.

2. Sign up into your Appwrite instance and create project with both name and ID set to `tmStats`
3. Install [Appwrite CLI](https://appwrite.io/docs/command-line) locally, and login: `appwrite login`
4. Deploy collections: `appwrite push collection`
5. Deploy functions: `appwrite push functions`

To prepare your changes from your Appwrite instance database to production one:

1. Pull database changes: `appwrite init collection`

To create a new function:

1. Create function: `appwrite init function`

> Make sure you create functions using `deno-2.0` runtime.

Feel free to do manual changes to [appwrite.json](appwrite.json) if you are familiar with this file.

## 🚀 Deployment

**Frontend:**

1. Install dependencies: `npm install`
2. Build project: `npm run build`
3. Deploy to adapter of a choice

> Frontend build does not use any special environment variables.

**Backend:**

1. Deploy database changes, if necessary: `appwrite push collection`
2. Deploy function changes, if necessary: `appwrite push function`

---

## 📚 Svelte Kit Resources (Generated)

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```bash
# create a new project in the current directory
npx sv create

# create a new project in my-app
npx sv create my-app
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
