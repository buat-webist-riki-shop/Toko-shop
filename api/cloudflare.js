import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";

// --- Konfigurasi GitHub (semua lewat ENV) ---
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.REPO_OWNER;
const repo  = process.env.REPO_NAME;
const branch = process.env.REPO_BRANCH || "main";

// --- Konfigurasi Cloudflare Global API (BARU) ---
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

// --- Helper Cloudflare (BARU) ---
async function fetchDomainsFromCloudflare() {
    if (!cfApiToken || !cfAccountId) {
        console.warn("Cloudflare Global API Token atau Account ID tidak diatur. Melewatkan pengambilan domain dari API.");
        return [];
    }
    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones?account.id=${cfAccountId}&per_page=100`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${cfApiToken}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        if (!data.success) {
            console.error("Gagal mengambil domain dari Cloudflare API:", data.errors);
            return [];
        }
        // Ambil hanya nama domain dari hasil
        return data.result.map(zone => zone.name);
    } catch (error) {
        console.error("Error saat fetch ke Cloudflare API:", error);
        return [];
    }
}


// --- Handler utama ---
export default async function handler(request, response) {
    // ✅ CORS
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (request.method === "OPTIONS") return response.status(200).end();

    if (request.method !== "POST") {
        return response.status(405).json({ message: "Metode tidak diizinkan." });
    }

    const { action, data, adminPassword } = request.body;
    if (!action) return response.status(400).json({ message: "Aksi tidak ditemukan." });

    const adminActions = [
        "getApiKeys", "createApiKey", "deleteApiKey",
        "getRootDomainsAdmin", "addRootDomain", "deleteRootDomain"
    ];

    try {
        if (adminActions.includes(action)) {
            if (adminPassword !== process.env.ADMIN_PASSWORD) {
                return response.status(403).json({ message: "Password admin salah." });
            }
        }

        const apiKeys = await readJsonFromGithub("data/isi_json/apikeys.json");

        // ✅ Validasi API Key
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
                // MODIFIKASI: Ambil dari 2 sumber dan gabungkan
                const domainsFromJson = Object.keys(domains);
                const domainsFromApi = await fetchDomainsFromCloudflare();

                // Gabungkan dan hapus duplikat menggunakan Set
                const combinedDomains = new Set([...domainsFromJson, ...domainsFromApi]);
                
                return response.status(200).json({ domains: Array.from(combinedDomains).sort() });
            }

            case "createSubdomain": {
                const { subdomain, domain, type, content, proxied } = data;
                
                // Cek dulu apakah domain ada di JSON (karena butuh API Token spesifik domain)
                const domainInfo = domains[domain];
                if (!domainInfo) throw new Error("Domain utama tidak ditemukan atau tidak dikonfigurasi untuk pembuatan subdomain via metode ini.");

                const headers = {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${domainInfo.apitoken}`
                };

                const created_domains = [];

                // Record utama
                const mainRecordData = {
                    type,
                    name: `${subdomain}.${domain}`,
                    content,
                    proxied,
                    ttl: 1
                };

                const mainRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${domainInfo.zone}/dns_records`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify(mainRecordData)
                });
                const mainResult = await mainRes.json();
                if (!mainResult.success) {
                    throw new Error(`Gagal membuat record utama: ${mainResult.errors[0].message}`);
                }
                created_domains.push(mainResult.result.name);

                // Record node tambahan kalau tipe A
                if (type === "A") {
                    const nodeName = `node${Math.floor(10 + Math.random() * 90)}.${subdomain}.${domain}`;
                    const nodeRecordData = { type: "A", name: nodeName, content, proxied, ttl: 1 };

                    const nodeRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${domainInfo.zone}/dns_records`, {
                        method: "POST",
                        headers,
                        body: JSON.stringify(nodeRecordData)
                    });
                    const nodeResult = await nodeRes.json();
                    if (!nodeResult.success) {
                        throw new Error(`Record utama dibuat, tapi gagal membuat record node: ${nodeResult.errors[0].message}`);
                    }
                    created_domains.push(nodeResult.result.name);
                }

                return response.status(200).json({ message: "Subdomain berhasil dibuat!", created_domains });
            }

            // == AKSI UNTUK ADMIN ==
            case "getApiKeys": {
                return response.status(200).json(apiKeys);
            }
            case "createApiKey": {
                const { key, duration, unit, isPermanent } = data;
                if (!key) throw new Error("Nama API Key tidak boleh kosong.");
                if (apiKeys[key]) throw new Error("API Key ini sudah ada.");

                let expires_at = "permanent";
                if (!isPermanent) {
                    const now = new Date();
                    const d = parseInt(duration, 10);
                    if (unit === "days") now.setDate(now.getDate() + d);
                    if (unit === "weeks") now.setDate(now.getDate() + (d * 7));
                    if (unit === "months") now.setMonth(now.getMonth() + d);
                    if (unit === "years") now.setFullYear(now.getFullYear() + d);
                    expires_at = now.toISOString();
                }
                
                const newKeyData = { created_at: new Date().toISOString(), expires_at };
                apiKeys[key] = newKeyData;
                await writeJsonToGithub("data/isi_json/apikeys.json", apiKeys);
                
                return response.status(200).json({
                    message: "API Key berhasil dibuat.",
                    details: newKeyData
                });
            }
            case "deleteApiKey": {
                const { key } = data;
                if (!apiKeys[key]) throw new Error("API Key tidak ditemukan.");
                delete apiKeys[key];
                await writeJsonToGithub("data/isi_json/apikeys.json", apiKeys);
                return response.status(200).json({ message: "API Key berhasil dihapus." });
            }
            case "getRootDomainsAdmin": {
                return response.status(200).json(domains);
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
                if (!domains[domain]) throw new Error("Domain tidak ditemukan.");
                delete domains[domain];
                await writeJsonToGithub("data/isi_json/domains.json", domains);
                return response.status(200).json({ message: "Domain berhasil dihapus." });
            }

            default:
                return response.status(400).json({ message: "Aksi tidak valid." });
        }
    } catch (error) {
        console.error(`Error pada aksi "${action}":`, error);
        return response.status(500).json({ message: error.message || "Terjadi kesalahan di server." });
    }
}
