import { Octokit } from "@octokit/rest";

export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ message: 'Metode tidak diizinkan.' });
    }

    try {
        const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
        const REPO_OWNER = process.env.REPO_OWNER;
        const REPO_NAME = process.env.REPO_NAME;
        const FILE_PATH = 'data/isi_json/settings.json';

        const octokit = new Octokit({ auth: GITHUB_TOKEN });

        const { data: fileData } = await octokit.repos.getContent({
            owner: REPO_OWNER,
            repo: REPO_NAME,
            path: FILE_PATH,
        });

        const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
        const settingsJson = JSON.parse(content);

        response.status(200).json(settingsJson);

    } catch (error) {
        console.error("Error getSettings:", error);
        if (error.status === 404) {
             return response.status(404).json({ message: 'File settings.json tidak ditemukan. Harap buat file tersebut terlebih dahulu.' });
        }
        response.status(500).json({ message: 'Terjadi kesalahan di server.', error: error.message });
    }
}
