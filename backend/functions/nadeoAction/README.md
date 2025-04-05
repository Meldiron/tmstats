# nadeoAction & nadeoCron

Welcome to the documentation of this function 👋 We strongly recommend keeping this file in sync with your function's logic to make sure anyone can easily understand your function in the future. If you don't need documentation, you can remove this file.

## 🤖 Documentation

Function used for any Nadeo-API related requests:

- Pull TOTD maps information
- Pull campaign maps information
- Pull user's TOTD medals
- Pull user's campaign medals

This function has 2 endpoints. One for user-faced update method `mod.ts`, one for internal scheduler to pull new daily maps information `mod_daily_cron.ts`. Both of these have different input, output, and environment variables configuration, In the end, these are 2 separate functions, that only lives in one folder for easy method sharing.

## 1. Endpoint 'mod.ts'

The function respects maximum API limit of 1 request per second to all Nadeo services.

_Example input:_

```json
{
	"userId": "06e99ad3-cded-4440-a19c-b3df4fda8004",
	"password": "My-Secret123"
}
```

`password` is optional parameter and if provided (with correct value), a delay check will be skipped. If not provided, profile can only be refreshed once X mintes (you can find exact value in the code).

_Example output:_

```json
{
	"message": "Profile successfully updated!"
}
```

### 📝 Environment Variables

List of environment variables used by this cloud function:

- **APPWRITE_FUNCTION_ENDPOINT** - Endpoint of Appwrite project
- **APPWRITE_FUNCTION_API_KEY** - Appwrite API Key
- **ADMIN_PASS** - If matched with payload `password`, a delay check for fetching profile is ignored
- **NADE_AUTH** - Base64 URL encoded email:password of Trackmania (Ubisoft) account

## 2. Endpoint 'mod_daily_cron.ts'

The function respects maximum API limit of 1 request per 5 seconds to all Nadeo services.

_Example input:_

No input is expected.

_Example output:_

```json
{
	"message": "Map information updated! Dowloaded 2 maps: id1234,id5678"
}
```

### 📝 Environment Variables

List of environment variables used by this cloud function:

- **APPWRITE_FUNCTION_ENDPOINT** - Endpoint of Appwrite project
- **APPWRITE_FUNCTION_API_KEY** - Appwrite API Key
- **NADE_AUTH** - Base64 URL encoded email:password of Trackmania (Ubisoft) account

## 🚀 Deployment

There are two ways of deploying the Appwrite function, both having the same results, but each using a different process. We highly recommend using CLI deployment to achieve the best experience.

### Using CLI

Make sure you have [Appwrite CLI](https://appwrite.io/docs/command-line#installation) installed, and you have successfully logged into your Appwrite server. To make sure Appwrite CLI is ready, you can use the command `appwrite client --debug` and it should respond with green text `✓ Success`.

Make sure you are in the same folder as your `appwrite.json` file and run `appwrite deploy function` to deploy your function. You will be prompted to select which functions you want to deploy.

### Manual using tar.gz

Manual deployment has no requirements and uses Appwrite Console to deploy the tag. First, enter the folder of your function. Then, create a tarball of the whole folder and gzip it. After creating `.tar.gz` file, visit Appwrite Console, click on the `Deploy Tag` button and switch to the `Manual` tab. There, set the `entrypoint` to `src/mod.ts` or `src/mod_daily_cron.ts`, and upload the file we just generated. This function should have 2 functions in Appwrite, each with different endpoint.
