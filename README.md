# SPFx Org Chart Web Part

## Local run (hosted workbench)

1. Use Node 22 LTS.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Trust local SPFx HTTPS certificate:
   ```bash
   gulp trust-dev-cert
   ```
4. Start local debug server:
   ```bash
   gulp serve
   ```
5. Open hosted workbench (replace tenant):
   ```
   https://yourtenant.sharepoint.com/_layouts/15/workbench.aspx?loadSPFX=true&debugManifestsFile=https://localhost:4321/temp/manifests.js
   ```

> If you get **"Error loading debug script"**, verify all of the following:
>
> - `gulp serve` is still running.
> - URL uses **`https://localhost:4321/temp/manifests.js`** exactly for `debugManifestsFile`.
> - Browser trusts your local dev certificate (run `gulp trust-dev-cert` again if needed).
> - You replaced `yourtenant` with your real tenant.
> - Corporate proxy/firewall is not blocking localhost HTTPS loopback.

## Build/package

```bash
gulp bundle --ship
gulp package-solution --ship
```

Output package path:

- `sharepoint/solution/spfx-org-chart.sppkg`

## Required Graph API permissions

Approve these in SharePoint admin API access page after deploying package:

- `User.Read`
- `User.Read.All`
- `Directory.Read.All`
