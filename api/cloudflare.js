import { Octokit } from "@octokit/rest";
import fetch from "node-fetch";

// --- Konfigurasi (Tetap sama) ---
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const owner = process.env.REPO_OWNER;
const repo  = process.env.REPO_NAME;
const branch = process.env.REPO_BRANCH || "main";
const cfApiToken = process.env.CLOUDFLARE_API_TOKEN;
const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;

// --- Helper (Tetap sama) ---
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
    await octokit.repos.createOrUpdateFileContents({ owner, repo, path, message: `update ${path}`, content, sha, branch });
}

// --- Handler utama ---
export default async function handler(request, response) {
    response.setHeader("Access-Control-Allow-Origin", "*");
    response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (request.method === "OPTIONS") return response.status(200).end();

    if (request.method !== "POST") return response.status(405).json({ message: "Metode tidak diizinkan." });

    const { action, data, adminPassword } = request.body;
    if (!action) return response.status(400).json({ message: "Aksi tidak ditemukan." });

    try {
        const apiKeys = await readJsonFromGithub("data/isi_json/apikeys.json");
        const domains = await readJsonFromGithub("data/isi_json/domains.json");

        // Validasi API Key Pengguna (jika diperlukan)
        const userActions = ["getRootDomains", "createSubdomain", "validateApiKey"];
        if (userActions.includes(action)) {
             const userApiKey = data.apikey;
             const keyData = apiKeys[userApiKey];
             if (!userApiKey || !keyData || (keyData.expires_at !== "permanent" && new Date() > new Date(keyData.expires_at))) {
                 return response.status(403).json({ message: "Akses ditolak: API Key tidak valid." });
             }
             if (action === 'validateApiKey') return response.status(200).json({ message: "API Key valid." });
        }
        
        // --- BLOK DIAGNOSTIK DIMULAI DI SINI ---
        switch (action) {
            case "getRootDomains": {
                // TES 1: Apakah Environment Variable ADA?
                if (!cfApiToken || !cfAccountId) {
                    throw new Error("DIAGNOSTIK: CLOUDFLARE_API_TOKEN atau CLOUDFLARE_ACCOUNT_ID tidak ditemukan di server. Cek lagi nama variabel di Vercel & redeploy.");
                }

                let domainsFromApi = [];
                // TES 2: Apakah Environment Variable BENAR?
                try {
                    const apiResponse = await fetch(`https://api.cloudflare.com/client/v4/zones?account.id=${cfAccountId}&per_page=100`, {
                        headers: { 'Authorization': `Bearer ${cfApiToken}`, 'Content-Type': 'application/json' }
                    });
                    const apiResult = await apiResponse.json();
                    if (!apiResult.success) {
                        // Jika token/ID salah, errornya akan ditampilkan
                        throw new Error(`DIAGNOSTIK: Error dari Cloudflare -> "${apiResult.errors[0].message}". Cek kembali ISI token/ID Anda.`);
                    }
                    domainsFromApi = apiResult.result.map(zone => zone.name);
                } catch (e) {
                    // Lempar error agar bisa dilihat di frontend
                    throw new Error(e.message);
                }
                
                // Jika lolos, gabungkan seperti biasa
                const domainsFromJson = Object.keys(domains);
                const combinedDomains = new Set([...domainsFromJson, ...domainsFromApi]);
                return response.status(200).json({ domains: Array.from(combinedDomains).sort() });
            }

            // Aksi createSubdomain tetap menggunakan logika cerdas yang sudah benar
            case "createSubdomain": {
                const { subdomain, domain, type, content, proxied } = data;
                const domainInfo = domains[domain];
                let cfAuthHeaders;
                let zoneId;

                if (domainInfo && domainInfo.apitoken && domainInfo.zone) {
                    cfAuthHeaders = { "Authorization": `Bearer ${domainInfo.apitoken}`, "Content-Type": "application/json" };
                    zoneId = domainInfo.zone;
                } else {
                    if (!cfApiToken) throw new Error("DIAGNOSTIK: Gagal membuat subdomain karena Global API Token tidak diatur di server.");
                    cfAuthHeaders = { "Authorization": `Bearer ${cfApiToken}`, "Content-Type": "application/json" };
                    const zoneRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, { headers: cfAuthHeaders });
                    const zoneData = await zoneRes.json();
                    if (!zoneData.success || zoneData.result.length === 0) throw new Error(`DIAGNOSTIK: Gagal menemukan Zone ID untuk domain ${domain}.`);
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
                    if (nodeResult.success) created_domains.push(nodeResult.result.name);
                }
                return response.status(200).json({ message: "Subdomain berhasil dibuat!", created_domains });
            }
            
            // Aksi lain tidak diubah
            default:
                 return response.status(400).json({ message: `Aksi "${action}" tidak ditemukan atau tidak didukung.` });
        }
    } catch (error) {
        console.error(`Error pada aksi "${action}":`, error);
        // Kirim pesan error yang jelas ke frontend
        return response.status(500).json({ message: error.message || "Terjadi kesalahan di server." });
    }
}
