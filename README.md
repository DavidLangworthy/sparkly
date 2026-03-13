# Sparkly

Sparkly is a single-page static drawing app that ships as plain HTML, CSS, and JavaScript.

## Repo Layout

- `site/`: deployable static site content
- `infra/`: Azure Bicep for the Static Web App
- `scripts/`: Bash scripts for GitHub bootstrap and Azure deployment

## Prerequisites

- `git`
- `gh`
- `az`
- `jq`
- `npx`

You also need to be logged into GitHub with `gh auth login` and Azure with `az login`.

## One-Time GitHub Bootstrap

Create the public GitHub repository and push the current branch:

```bash
./scripts/create-github-repo.sh DavidLangworthy sparkly
```

If you omit the arguments, the script defaults to the authenticated GitHub user and the current folder name:

```bash
./scripts/create-github-repo.sh
```

## Azure Deployment

Deploy infrastructure plus static content to a new resource group:

```bash
./scripts/deploy-full.sh 5a7dbc98-fb82-426b-b1e5-39e76974a287 sparkly-rg centralus sparkly
```

Defaults and behavior:

- `app-name` defaults to `sparkly`
- `STATIC_WEB_APP_LOCATION` defaults to `Central US`
- infra outputs are written to `deploy.outputs.json`
- deployment is script-driven only; no GitHub Actions are configured

You can also run the two deploy phases separately:

```bash
./scripts/deploy-infra.sh 5a7dbc98-fb82-426b-b1e5-39e76974a287 sparkly-rg centralus sparkly
./scripts/deploy-frontend.sh sparkly-rg "$(jq -r '.staticWebAppName.value' deploy.outputs.json)"
```

## Custom Domain: Two-Pass Flow

First pass:

```bash
CUSTOM_DOMAIN=sparkly.davidlangworthy.com \
./scripts/deploy-full.sh 5a7dbc98-fb82-426b-b1e5-39e76974a287 sparkly-rg centralus sparkly
```

On the first run, the scripts deploy the site and print the exact CNAME target for Azure Static Web Apps. Add the DNS record at your DNS provider:

```text
Type: CNAME
Name: sparkly.davidlangworthy.com
Value: <azure-default-hostname>
```

If your DNS provider wants only the host label, use `sparkly`.

Second pass:

```bash
CUSTOM_DOMAIN=sparkly.davidlangworthy.com \
./scripts/deploy-full.sh 5a7dbc98-fb82-426b-b1e5-39e76974a287 sparkly-rg centralus sparkly
```

Once the CNAME is live, the rerun binds the custom domain in Azure.

You can also bind the domain as a standalone step after deployment:

```bash
./scripts/configure-custom-domain.sh sparkly-rg <static-web-app-name> sparkly.davidlangworthy.com
```

## Local Use

Open [site/index.html](/Users/david/mycode/sparkly/site/index.html) directly in a browser for local use, or serve the `site/` directory with any static file server.
