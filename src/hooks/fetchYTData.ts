import { useQuery } from "@tanstack/react-query"


const fetchData = async () => {
    const res = await fetch("/.netlify/functions/fetchData");
    if (!res.ok) throw new Error("Fetch didn't work! Figure yourself out.");
    return res.json();
};

export const useYTData = () => {
    return useQuery({
        queryKey: ["youtubeData"],
        queryFn: fetchData
    })
}