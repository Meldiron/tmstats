# convertId

Welcome to the documentation of this function 👋 We strongly recommend keeping this file in sync with your function's logic to make sure anyone can easily understand your function in the future. If you don't need documentation, you can remove this file.

## 🤖 Documentation

Function to send username to [Trackmania.io](https://trackmania.io/) APIs, getting user ID as response. Finally, responds with fetched user ID.

This method respects API limit of 2 requests per second.

_Example input:_

```json
{
	"nick": "MeldironSK"
}
```

_Example output:_

```json
{
	"id": "06e99ad3-cded-4440-a19c-b3df4fda8004"
}
```

## 📝 Environment Variables

List of environment variables used by this cloud function:

No variables needed.

## 🚀 Deployment

There are two ways of deploying the Appwrite function, both having the same results, but each using a different process. We highly recommend using CLI deployment to achieve the best experience.

### Using CLI

Make sure you have [Appwrite CLI](https://appwrite.io/docs/command-line#installation) installed, and you have successfully logged into your Appwrite server. To make sure Appwrite CLI is ready, you can use the command `appwrite client --debug` and it should respond with green text `✓ Success`.

Make sure you are in the same folder as your `appwrite.json` file and run `appwrite deploy function` to deploy your function. You will be prompted to select which functions you want to deploy.

### Manual using tar.gz

Manual deployment has no requirements and uses Appwrite Console to deploy the tag. First, enter the folder of your function. Then, create a tarball of the whole folder and gzip it. After creating `.tar.gz` file, visit Appwrite Console, click on the `Deploy Tag` button and switch to the `Manual` tab. There, set the `entrypoint` to `src/mod.ts`, and upload the file we just generated.
