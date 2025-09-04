import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";

// --- Konfigurasi GitHub (semua lewat ENV) ---
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.REPO_OWNER;
const repo  = process.env.REPO_NAME;
const branch = process.env.REPO_BRANCH || "main"; // bisa tambah REPO_BRANCH di .env kalau mau fleksibel

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

        switch (action) {
            // == AKSI UNTUK PENGGUNA ==
            case "getRootDomains": {
                // 1. Ambil domain dari domains.json
                const domainsFromJsonFile = await readJsonFromGithub("data/isi_json/domains.json");
                const domainNamesFromJson = Object.keys(domainsFromJsonFile);

                // 2. Ambil domain dari Cloudflare API jika token ada
                let domainNamesFromCf = [];
                if (process.env.CLOUDFLARE_API_TOKEN) {
                    try {
                        const cfResponse = await fetch("https://api.cloudflare.com/client/v4/zones", {
                            method: "GET",
                            headers: {
                                "Content-Type": "application/json",
                                "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
                            }
                        });
                        const cfResult = await cfResponse.json();
                        if (cfResult.success && Array.isArray(cfResult.result)) {
                            domainNamesFromCf = cfResult.result.map(zone => zone.name);
                        } else {
                            console.error("Gagal mengambil domain dari Cloudflare API:", cfResult.errors || "Struktur respons tidak dikenal.");
                        }
                    } catch (cfError) {
                        console.error("Error saat menghubungi Cloudflare API:", cfError);
                    }
                } else {
                     console.log("Variabel lingkungan CLOUDFLARE_API_TOKEN tidak diatur. Hanya menggunakan domains.json.");
                }

                // 3. Gabungkan, hilangkan duplikat, dan urutkan
                const combinedDomains = [...new Set([...domainNamesFromJson, ...domainNamesFromCf])];
                combinedDomains.sort();

                return response.status(200).json({ domains: combinedDomains });
            }

            case "createSubdomain": {
                // Untuk membuat subdomain, kita tetap butuh info lengkap dari domains.json
                const domains = await readJsonFromGithub("data/isi_json/domains.json");
                const { subdomain, domain, type, content, proxied } = data;
                const domainInfo = domains[domain];
                
                // Logika ini memastikan hanya domain yang terkonfigurasi di domains.json yang bisa dipakai
                if (!domainInfo) throw new Error("Domain utama tidak ditemukan atau belum dikonfigurasi di sistem.");

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
                const domains = await readJsonFromGithub("data/isi_json/domains.json");
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
                const domains = await readJsonFromGithub("data/isi_json/domains.json");
                return response.status(200).json(domains);
            }
            case "addRootDomain": {
                const domains = await readJsonFromGithub("data/isi_json/domains.json");
                const { domain, zone, apitoken } = data;
                if (domains[domain]) throw new Error("Domain ini sudah ada.");
                domains[domain] = { zone, apitoken };
                await writeJsonToGithub("data/isi_json/domains.json", domains);
                return response.status(200).json({ message: "Domain berhasil ditambahkan." });
            }
            case "deleteRootDomain": {
                const domains = await readJsonFromGithub("data/isi_json/domains.json");
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