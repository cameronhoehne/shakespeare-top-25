import type { Handler } from "@netlify/functions"


const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

const username = process.env.USERNAME;
const password = process.env.PASSWORD;

const uri = `mongodb+srv://${username}:${password}@shakespeare-yt-data.2msvzwp.mongodb.net/?retryWrites=true&w=majority&appName=Shakespeare-YT-data`

const handler: Handler = async () => {
    const apiKey = process.env.YT_API_KEY;
    const client = new MongoClient(uri);


    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Missing API Key" })
        };
    }

    try {

        await client.connect();
        const db = client.db("youtube_data");
        const collection = db.collection("videos");

        const existing = await collection.findOne({ _id: "latest" });
        const now = new Date();
        const lastFetched = existing?.fetchedAt ? new Date(existing.fetchedAt) : new Date(0);
        const hoursSince = (now.getTime() - lastFetched.getTime()) / (1000 * 60 * 60);


        if (hoursSince < 24 && existing?.data) {
            return {
                statusCode: 200,
                body: JSON.stringify(existing.data)
            }
        }

        const searchURL = `https://youtube.googleapis.com/youtube/v3/search?key=${apiKey}&part=snippet&channelId=UCyAA_HbOJZ_-quwmcLIKNXA&order=viewCount&pageInfo.resultsPerPage=25&maxResults=25`

        const searchRes = await fetch(searchURL);
        const searchData = await searchRes.json();

        const videoIds = searchData.items
            .filter((item: any) => item.id.kind === "youtube#video")
            .map((item: any) => item.id.videoId)
            .join(",");

        if (!videoIds) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: "No videos found!" })
            }
        }

        const detailsURL = `https://www.googleapis.com/youtube/v3/videos?key=${apiKey}&id=${videoIds}&part=contentDetails,statistics,snippet`

        const detailsRes = await fetch(detailsURL);
        const detailsData = await detailsRes.json();

        await collection.updateOne(
            { _id: "latest" },
            {
                $set: {
                    fetchedAt: now.toISOString(),
                    data: detailsData.items,
                },
            },
            { upsert: true }
        )

        return {
            statusCode: 200,
            body: JSON.stringify(detailsData.items)
        };

    } catch (error: any) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message || "Unexpected error!" })
        }
    } finally {
        await client.close();
    }
}

export { handler };
export const schedule = "0 0 * * *";