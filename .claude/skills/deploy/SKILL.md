---
name: deploy
description: Build and deploy Venn frontend and/or backend to production via systemctl
disable-model-invocation: true
---

# Deploy Skill

Deploy the Venn app to production. Accepts an optional argument: `frontend`, `backend`, or `all` (default: `all`).

## Steps

### Backend deploy
1. Run `sudo systemctl restart venn-api`
2. Wait 2 seconds, then run `systemctl is-active venn-api` to verify it's running
3. Report success or failure

### Frontend deploy
1. Run `cd /root/venn/frontend && npm run build`
2. If build succeeds, run `sudo systemctl restart venn-frontend`
3. Wait 2 seconds, then run `systemctl is-active venn-frontend` to verify it's running
4. Report success or failure

### Output
Report a summary: which services were deployed and their status (active/failed).
