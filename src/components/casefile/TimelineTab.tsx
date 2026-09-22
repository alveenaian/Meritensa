import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Calendar, Circle } from "lucide-react";

interface TimelineTabProps {
  caseData: any;
}

export function TimelineTab({ caseData }: TimelineTabProps) {
  const analysisResults = (caseData.analysisResults as any) || {};
  const timeline = analysisResults.timeline || (caseData.generatedTimeline as any[]) || [];

  if (timeline.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-600">No timeline data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Visual Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-6">
            {/* Vertical line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

            {timeline.map((event: any, index: number) => (
              <div key={index} className="relative flex items-start gap-4 pl-10">
                {/* Timeline dot */}
                <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 border-4 border-white">
                  <Circle className="h-3 w-3 fill-primary-600 text-primary-600" />
                </div>

                {/* Event content */}
                <div className="flex-1 rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{event.event}</p>
                      <p className="mt-1 text-sm text-gray-600">{event.significance}</p>
                    </div>
                    <span className="flex-shrink-0 text-sm font-medium text-gray-500">
                      {event.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Table */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Legal Significance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeline.map((event: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.date}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {event.event}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {event.significance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
