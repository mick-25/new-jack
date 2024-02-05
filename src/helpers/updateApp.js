import decompress from "decompress";
import fs from "fs/promises";
import { version as localVersion } from "../../package.json";

async function getAppVersionGithub() {
    /** @type {GitHub.Release} */
    // @ts-ignore
    const latestRelease = await (
        await fetch("https://api.github.com/repos/aymene69/stremio-jackett/releases/latest")
    ).json();

    const appVersion = latestRelease.tag_name;
    try {
        return appVersion.replace("v", "");
    } catch (e) {
        return localVersion;
    }
}

export async function updateApp() {
    const latestVersion = await getAppVersionGithub();

    if (localVersion === latestVersion) {
        return;
    }

    console.log("A new update is available!");
    console.log("Local version:", localVersion, "GitHub version:", latestVersion);
    console.log("Updating app...");

    const releaseUrl = "https://api.github.com/repos/aymene69/stremio-jackett/releases/latest";
    const releaseResponse = await fetch(releaseUrl);

    if (!releaseResponse.ok) {
        console.error('Failed to fetch GitHub release information:', releaseResponse.statusText);
        return;
    }

    const releaseJson = await releaseResponse.json();

    const assets = releaseJson.assets;
    if (assets && assets.length > 0) {
        const browserDownloadUrl = assets[0].browser_download_url;

        const assetResponse = await fetch(browserDownloadUrl);

        if (!assetResponse.ok) {
            console.error('Failed to fetch GitHub asset:', assetResponse.statusText);
            return;
        }

        const buffer = await assetResponse.arrayBuffer();
        await fs.writeFile("../update.zip", Buffer.from(buffer));
        await decompress("../update.zip", "dist");
        await fs.rm("../update.zip");

        console.log("App updated.");
    } else {
        console.error('Assets or browser_download_url not available in the GitHub API response.');
    }
}
