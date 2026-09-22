import type { VideoBlock as VideoBlockType } from "./types";

function getVideoEmbedUrl(url: string): { embedUrl: string; type: "youtube" | "vimeo" | "direct" } | null {
  // YouTube detection
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return {
      embedUrl: `https://www.youtube.com/embed/${youtubeMatch[1]}`,
      type: "youtube",
    };
  }

  // Vimeo detection
  const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return {
      embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
      type: "vimeo",
    };
  }

  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return {
      embedUrl: url,
      type: "direct",
    };
  }

  return null;
}

export function VideoBlock({ data }: { data: VideoBlockType["data"] }) {
  const videoInfo = getVideoEmbedUrl(data.url);
  const aspectRatio = data.aspectRatio || "16:9";
  const aspectRatioClass = {
    "16:9": "aspect-video",
    "4:3": "aspect-[4/3]",
    "1:1": "aspect-square",
  }[aspectRatio];

  if (!videoInfo) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-500">Invalid video URL</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="fade-in">
        <div className={`overflow-hidden rounded-2xl shadow-lg ${aspectRatioClass}`}>
          {videoInfo.type === "direct" ? (
            <video
              src={videoInfo.embedUrl}
              controls={data.controls !== false}
              autoPlay={data.autoplay}
              className="h-full w-full object-cover"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <iframe
              src={`${videoInfo.embedUrl}${data.autoplay ? "?autoplay=1" : ""}`}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="Embedded video"
            />
          )}
        </div>
        {data.caption && (
          <p className="mt-4 text-center text-sm text-gray-600 italic">{data.caption}</p>
        )}
      </div>
    </div>
  );
}
