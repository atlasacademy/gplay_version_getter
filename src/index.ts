import json5 from "json5";

export interface Env {}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext,
    ): Promise<Response> {
        const headers = {
            "Access-Control-Allow-Origin": "*",
        };
        const packageId = new URL(request.url).searchParams.get("id");
        if (packageId === null) {
            return new Response(
                "id parameter required. For example: ?id=com.google.android.play.games",
                { status: 400, headers },
            );
        }

        const gplayResponse = await fetch(
            `https://play.google.com/store/apps/details?id=${packageId}`,
        );
        if (gplayResponse.status !== 200) {
            return new Response(
                `Google Play page returns status code ${gplayResponse.status} ${gplayResponse.statusText}`,
                { status: 500, headers },
            );
        }

        const siteText = await gplayResponse.text();
        const matches = siteText.matchAll(
            /<script class=\"\S+\" nonce=\"\S+\">AF_initDataCallback\((.*?)\);/g,
        );
        for (const match of matches) {
            const data = json5.parse(match[1]);
            try {
                const play_store_version = data["data"][1][2][140][0][0][0];
                return new Response(play_store_version, {
                    status: 200,
                    headers,
                });
            } catch {}
        }

        return new Response(`Can't parse version from Google Play page`, {
            status: 500,
            headers,
        });
    },
};
