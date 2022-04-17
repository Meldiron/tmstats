# create-svelte

Everything you need to build a Svelte project, powered by [`create-svelte`](https://github.com/sveltejs/kit/tree/master/packages/create-svelte).

```
{
    "type": "updateProfile",
    "userId": "5ca1fa3a-3413-4863-86d7-7a47982abc1b",
    "password": "(uppercase k) ac minus 3numbers"
}

Meldiron: 06e99ad3-cded-4440-a19c-b3df4fda8004
Dejwfík: 5ca1fa3a-3413-4863-86d7-7a47982abc1b
Benko: f6fe29aa-45dc-4fe9-9a95-d5e2c39f6b5f
```

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!!!

```bash
# create a new project in the current directory
npm init svelte

# create a new project in my-app
npm init svelte my-app
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

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
