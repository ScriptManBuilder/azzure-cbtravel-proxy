# CBTravel Proxy

A reverse proxy server for CBTravel deals website with custom branding support. Designed for deployment on Railway.

## Features

- Full website proxy with custom branding
- Auto-fills registration code for users
- Custom logo, colors, and favicon support
- Cookie/session handling
- URL rewriting for seamless experience

## Quick Start

### Local Development

```bash
npm install
npm start
```

Server runs at `http://localhost:3000`

### Railway Deployment

1. Create a new project on [Railway](https://railway.app)
2. Connect your GitHub repository
3. Set environment variables in Railway dashboard
4. Deploy!

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `TARGET_URL` | Target website URL | `https://cbtravel.enjoymydeals.com` |
| `SITE_TYPE` | Site type (1=Lifestyle, 2=Retail, 3=Health, 4=Family) | `1` |
| `BRAND_NAME` | Your brand name | `Serenity` |
| `BRAND_COLOR` | Brand color | `#6366f1` |
| `BRAND_LOGO_URL` | Path to logo | `/assets/logo.png` |
| `BRAND_FAVICON_URL` | Path to favicon | `/assets/favicon.ico` |
| `REGISTRATION_CODE` | Auto-fill registration code | `accessvip25` |

## Custom Branding

1. Add your logo to `/assets/logo.png`
2. Add your favicon to `/assets/favicon.ico`
3. Update environment variables with your brand color

## Railway Setup

Set these environment variables in Railway:

```
PORT=3000
TARGET_URL=https://cbtravel.enjoymydeals.com
SITE_TYPE=1
BRAND_NAME=Your Brand Name
BRAND_COLOR=#your-color
REGISTRATION_CODE=accessvip25
```
