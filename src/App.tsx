import './App.css'
import { useYTData } from "./hooks/fetchYTData"

import * as XLSX from "xlsx";

function App() {
  const { data, isLoading, error } = useYTData();
  if (isLoading) return <h1>Loading...</h1>
  if (error) return <h1>Error: {(error as Error).message}</h1>

  const formatDuration = (isoDuration: string): string => {
    const regex = /^PT(\d+H)?(\d+M)?(\d+S)?$/;
    const matches = isoDuration.match(regex);

    if (!matches) {
      return "00:00:00"
    }

    const hours = matches[1] ? parseInt(matches[1].replace("H", "")) : 0;
    const minutes = matches[2] ? parseInt(matches[2].replace('M', '')) : 0;
    const seconds = matches[3] ? parseInt(matches[3].replace('S', '')) : 0;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  }

  const formatViews = (views: string | number): string => {
    const number = typeof views === "string" ? parseInt(views, 10) : views;
    return number.toLocaleString();
  }

  const formatPublishedDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-us", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    })
  }

  const findLifeOfVideo = (dateString: string): string => {
    const publishedDate = new Date(dateString);
    const currentDate = new Date();

    const timeDiff = currentDate.getTime() - publishedDate.getTime();

    const days = Math.floor(timeDiff / (1000 * 3600 * 24));
    const years = Math.floor(days / 365);
    const months = Math.floor(days / 30);

    if (years > 0) {
      return `${years} year${years > 1 ? "s" : ""} ago`;
    } else if (months > 0) {
      return `${months} month${months > 1 ? "s" : ""} ago`;
    } else if (days > 0) {
      return `${days} day${days > 1 ? "s" : ""} ago`;
    } else {
      return "Uploaded Today";
    }
  };

  const generateExcel = (data: { items: any[] }) => {
    const reshaped = data.items.map(item => ({
      'Video Title': item.snippet.title,
      'Views': formatViews(item.statistics.viewCount),
      'Duration': formatDuration(item.contentDetails.duration),
      'Published Date': formatPublishedDate(item.snippet.publishedAt),
      'Age of Video': findLifeOfVideo(item.snippet.publishedAt)
    }));

    const ws = XLSX.utils.json_to_sheet(reshaped, {
      header: ['Video Title', 'Views', 'Duration', 'Published Date']
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "YouTube Data");

    XLSX.writeFile(wb, "youtube_data.xlsx");
  };

  return (
    <div className='parent-container'>
      <h1>Top Videos by View Count</h1>

      <button onClick={() => generateExcel(data)}>
        Download Excel
      </button>

      {(() => {
        const fetchedAt = data?.fetchedAt;

        return (
          <p style={{ fontStyle: "italic", fontSize: "0.9rem" }}>
            Last Updated: {fetchedAt ? new Date(fetchedAt).toLocaleString() : "Unknown"}
          </p>
        );
      })()}


      <ul className='results-container'>
        {data.items.map((video: any) => {
          const formattedDuration = formatDuration(video.contentDetails.duration);
          const formattedViews = formatViews(video.statistics.viewCount);
          const formattedDate = formatPublishedDate(video.snippet.publishedAt);
          const lifeOfVideo = findLifeOfVideo(video.snippet.publishedAt);

          return (
            <li key={video.id}>
              <div className='image-container'>
                <a href={`https://www.youtube.com/watch?v=${video.id}`} target='_blank'>
                  <img src={video.snippet.thumbnails.standard.url} />
                </a></div> <br />
              <strong>{video.snippet.title}</strong><br />
              Views: {formattedViews} <br />
              Duration: {formattedDuration} <br />
              Upload Date: {formattedDate} - that was {lifeOfVideo}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default App
