import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";

// --- Konfigurasi GitHub (semua lewat ENV) ---
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.REPO_OWNER;
const repo  = process.env.REPO_NAME;
const branch = process.env.REPO_BRANCH || "main";

// --- Konfigurasi Cloudflare Global API ---
const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

// --- Helper GitHub ---
async function readJsonFromGithub(path) {
    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
        const content = Buffer.from(data.content, "base64").toString();
        return JSON.parse(content);
    } catch (err) {
        if (err.status === 404) return {};
        throw err;
    }
}

async function writeJsonToGithub(path, json) {
    let sha;
    try {
        const { data } = await octokit.repos.getContent({ owner, repo, path, ref: branch });
        sha = data.sha;
    } catch (err) {
        if (err.status !== 404) throw err;
    }
    const content = Buffer.from(JSON.stringify(json, null, 2)).toString("base64");
    await octokit.repos.createOrUpdateFileContents({
        owner,
        repo,
        path,
        message: `update ${path}`,
        content,
        sha,
        branch
    });
}

// --- Helper Cloudflare ---
async function fetchDomainsFromCloudflare() {
    if (!cfApiToken || !cfAccountId) {
        console.warn("Cloudflare Global API Token atau Account ID tidak diatur. Melewatkan pengambilan domain dari API.");
        return [];
    }
    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones?account.id=${cfAccountId}&per_page=100`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${cfApiToken}`, 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        if (!data.success) {
            console.error("Gagal mengambil domain dari Cloudflare API:", data.errors);
            return [];
        }
        return data.result.map(zone => zone.name);
    } catch (error) {
        console.error("Error saat fetch ke Cloudflare API:", error);
        return [];
    }
}

// --- Handler utama ---
export default async function handler(request, response) {
    // CORS
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (request.method === "OPTIONS") return response.status(200).end();

    if (request.method !== "POST") {
        return response.status(405).json({ message: "Metode tidak diizinkan." });
    }

    const { action, data, adminPassword } = request.body;
    if (!action) return response.status(400).json({ message: "Aksi tidak ditemukan." });

    const adminActions = ["getApiKeys", "createApiKey", "deleteApiKey", "getRootDomainsAdmin", "addRootDomain", "deleteRootDomain"];
    try {
        if (adminActions.includes(action)) {
            if (adminPassword !== process.env.ADMIN_PASSWORD) {
                return response.status(403).json({ message: "Password admin salah." });
            }
        }

        const apiKeys = await readJsonFromGithub("data/isi_json/apikeys.json");

        if (action === "validateApiKey") {
            const keyData = apiKeys[data.apikey];
            if (!keyData || (keyData.expires_at !== "permanent" && new Date() > new Date(keyData.expires_at))) {
                throw new Error("API Key tidak valid atau sudah kadaluwarsa.");
            }
            return response.status(200).json({ message: "API Key valid." });
        }

        const userActions = ["getRootDomains", "createSubdomain"];
        if (userActions.includes(action)) {
            const userApiKey = data.apikey;
            const keyData = apiKeys[userApiKey];
            if (!userApiKey || !keyData || (keyData.expires_at !== "permanent" && new Date() > new Date(keyData.expires_at))) {
                return response.status(403).json({ message: "Akses ditolak: API Key tidak valid." });
            }
        }

        const domains = await readJsonFromGithub("data/isi_json/domains.json");

        switch (action) {
            // == AKSI UNTUK PENGGUNA ==
            case "getRootDomains": {
                const domainsFromJson = Object.keys(domains);
                const domainsFromApi = await fetchDomainsFromCloudflare();
                const combinedDomains = new Set([...domainsFromJson, ...domainsFromApi]);
                return response.status(200).json({ domains: Array.from(combinedDomains).sort() });
            }

            case "createSubdomain": {
                const { subdomain, domain, type, content, proxied } = data;
                const domainInfo = domains[domain];
                let cfAuthHeaders;
                let zoneId;

                if (domainInfo && domainInfo.apitoken && domainInfo.zone) {
                    cfAuthHeaders = { "Authorization": `Bearer ${domainInfo.apitoken}`, "Content-Type": "application/json" };
                    zoneId = domainInfo.zone;
                } else {
                    if (!cfApiToken) throw new Error("Global API Token tidak diatur di server.");
                    cfAuthHeaders = { "Authorization": `Bearer ${cfApiToken}`, "Content-Type": "application/json" };
                    const zoneRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, { headers: cfAuthHeaders });
                    const zoneData = await zoneRes.json();
                    if (!zoneData.success || zoneData.result.length === 0) throw new Error(`Tidak dapat menemukan Zone ID untuk domain ${domain}.`);
                    zoneId = zoneData.result[0].id;
                }
                
                const created_domains = [];
                const mainRecordData = { type, name: `${subdomain}.${domain}`, content, proxied, ttl: 1 };
                const mainRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, { method: "POST", headers: cfAuthHeaders, body: JSON.stringify(mainRecordData) });
                const mainResult = await mainRes.json();
                if (!mainResult.success) throw new Error(`Gagal membuat record utama: ${mainResult.errors[0].message}`);
                created_domains.push(mainResult.result.name);

                if (type === "A") {
                    const nodeName = `node${Math.floor(10 + Math.random() * 90)}.${subdomain}.${domain}`;
                    const nodeRecordData = { type: "A", name: nodeName, content, proxied, ttl: 1 };
                    const nodeRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, { method: "POST", headers: cfAuthHeaders, body: JSON.stringify(nodeRecordData) });
                    const nodeResult = await nodeRes.json();
                     if (nodeResult.success) {
                        created_domains.push(nodeResult.result.name);
                    } else {
                        console.warn(`Record utama dibuat, tapi gagal membuat record node: ${nodeResult.errors[0].message}`);
                    }
                }
                return response.status(200).json({ message: "Subdomain berhasil dibuat!", created_domains });
            }

            // == AKSI UNTUK ADMIN ==
            case "getApiKeys": { return response.status(200).json(apiKeys); }
            case "createApiKey": {
                const { key, duration, unit, isPermanent } = data;
                if (!key || apiKeys[key]) throw new Error("API Key ini sudah ada atau kosong.");
                let expires_at = "permanent";
                if (!isPermanent) {
                    const now = new Date();
                    const d = parseInt(duration, 10);
                    if (unit === "days") now.setDate(now.getDate() + d);
                    else if (unit === "weeks") now.setDate(now.getDate() + (d * 7));
                    else if (unit === "months") now.setMonth(now.getMonth() + d);
                    expires_at = now.toISOString();
                }
                const newKeyData = { created_at: new Date().toISOString(), expires_at };
                apiKeys[key] = newKeyData;
                await writeJsonToGithub("data/isi_json/apikeys.json", apiKeys);
                return response.status(200).json({ message: "API Key berhasil dibuat.", details: { ...newKeyData } });
            }
            case "deleteApiKey": {
                const { key } = data;
                if (!apiKeys[key]) throw new Error("API Key tidak ditemukan.");
                delete apiKeys[key];
                await writeJsonToGithub("data/isi_json/apikeys.json", apiKeys);
                return response.status(200).json({ message: "API Key berhasil dihapus." });
            }
            
            case "getRootDomainsAdmin": {
                const domainsFromJson = domains;
                const domainsFromApi = await fetchDomainsFromCloudflare();
                
                domainsFromApi.forEach(domainName => {
                    if (!domainsFromJson[domainName]) {
                        domainsFromJson[domainName] = { from: "cloudflare" };
                    }
                });
                return response.status(200).json(domainsFromJson);
            }
            
            case "addRootDomain": {
                const { domain, zone, apitoken } = data;
                if (domains[domain]) throw new Error("Domain ini sudah ada.");
                domains[domain] = { zone, apitoken };
                await writeJsonToGithub("data/isi_json/domains.json", domains);
                return response.status(200).json({ message: "Domain berhasil ditambahkan." });
            }
            case "deleteRootDomain": {
                const { domain } = data;
                if (!domains[domain] || domains[domain].from === "cloudflare") {
                     throw new Error("Hanya bisa menghapus domain yang ditambahkan dari file. Domain dari API tidak bisa dihapus dari sini.");
                }
                delete domains[domain];
                await writeJsonToGithub("data/isi_json/domains.json", domains);
                return response.status(200).json({ message: "Domain berhasil dihapus dari file." });
            }

            default:
                return response.status(400).json({ message: "Aksi tidak valid." });
        }
    } catch (error) {
        console.error(`Error pada aksi "${action}":`, error);
        return response.status(500).json({ message: error.message || "Terjadi kesalahan di server." });
    }
}
