import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { useState } from "react";
import { Copy, Check, Download, BookOpen, Mail, FileText } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { useAuthStore } from "~/lib/stores/auth.store";
import toast from "react-hot-toast";
import { Link } from "@tanstack/react-router";
import Markdown from "markdown-to-jsx";

interface OutreachToolkitTabProps {
  caseId: string;
  proResults: {
    outreachEmail: string;
    humanNarrative: string;
    [key: string]: any;
  };
}

export function OutreachToolkitTab({ caseId, proResults }: OutreachToolkitTabProps) {
  const trpc = useTRPC();
  const token = useAuthStore((state) => state.token);
  const [emailCopied, setEmailCopied] = useState(false);
  const [storyCopied, setStoryCopied] = useState(false);

  const downloadOnePagerMutation = useMutation(
    trpc.downloadCasePacket.mutationOptions({
      onSuccess: (data) => {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("One-Pager downloaded!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to download one-pager");
      },
    })
  );

  const downloadFullPacketMutation = useMutation(
    trpc.downloadCasePacket.mutationOptions({
      onSuccess: (data) => {
        const link = document.createElement("a");
        link.href = data.downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Full packet downloaded!");
      },
      onError: (error) => {
        toast.error(error.message || "Failed to download packet");
      },
    })
  );

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(proResults.outreachEmail);
      setEmailCopied(true);
      toast.success("Email copied to clipboard!");
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleCopyStory = async () => {
    try {
      await navigator.clipboard.writeText(proResults.humanNarrative);
      setStoryCopied(true);
      toast.success("Story copied to clipboard!");
      setTimeout(() => setStoryCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  const handleDownloadOnePager = () => {
    downloadOnePagerMutation.mutate({
      token: token!,
      caseId,
      packetType: "one-pager",
    });
  };

  const handleDownloadFullPacket = () => {
    downloadFullPacketMutation.mutate({
      token: token!,
      caseId,
      packetType: "full",
    });
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <Mail className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Your Complete Outreach Toolkit
              </h3>
              <p className="text-sm text-blue-800 leading-relaxed">
                You've completed your analysis. Now it's time to connect with attorneys. 
                This toolkit gives you everything you need: a professional email to send, 
                a plain-English story to tell, downloadable packets for law firms, and 
                guidance on how to approach firms effectively.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Outreach Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Outreach Email Draft
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This is a professional, concise email you can send to contingency law firms. 
            It hits the key decision points attorneys care about: case type, defendant, 
            damages, and jurisdiction. Copy this and customize it as needed.
          </p>
          
          <div className="relative">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 pr-12">
              <div className="prose prose-sm max-w-none">
                <Markdown>{proResults.outreachEmail}</Markdown>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyEmail}
              className="absolute top-4 right-4"
            >
              {emailCopied ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-sm text-amber-800">
              <strong>Pro Tip:</strong> Attach the One-Pager PDF to this email. 
              Only send the Full Packet if the firm asks for more detail.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Plain English Story */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Your Story (Plain English)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This is your case in plain, accessible language — no legal jargon. 
            Use this when talking to attorneys on the phone, explaining your situation 
            to family, or describing what happened to non-lawyers.
          </p>
          
          <div className="relative">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 pr-12">
              <div className="prose prose-sm max-w-none">
                <Markdown>{proResults.humanNarrative}</Markdown>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyStory}
              className="absolute top-4 right-4"
            >
              {storyCopied ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Download Packets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Attorney Packets
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Download professional PDF packets to send to law firms. Start with the 
            One-Pager — it's designed to get a partner's attention in 60 seconds.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* One-Pager */}
            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">One-Pager</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Executive summary on one page. This is what gets printed and 
                    put on a partner's desk.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDownloadOnePager}
                isLoading={downloadOnePagerMutation.isPending}
                className="w-full"
                size="sm"
              >
                <Download className="mr-2 h-4 w-4" />
                Download One-Pager
              </Button>
            </div>

            {/* Full Packet */}
            <div className="rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 flex-shrink-0">
                  <FileText className="h-5 w-5 text-primary-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-gray-900">Full Attorney Packet</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Complete 10-15 page analysis with all sections. Send this if 
                    the firm asks for more detail.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleDownloadFullPacket}
                isLoading={downloadFullPacketMutation.isPending}
                className="w-full"
                size="sm"
                variant="secondary"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Full Packet
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm text-blue-800">
              <strong>Recommended Approach:</strong> Email the One-Pager first. 
              If the firm is interested, they'll ask for the Full Packet. This respects 
              their time and increases your response rate.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Guide Link */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-4">
          <div className="flex items-start gap-3">
            <BookOpen className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-2">
                How to Approach Law Firms
              </h3>
              <p className="text-sm text-green-800 mb-3">
                Not sure how to find the right attorney or what to say in your first call? 
                We've created a complete guide covering how to find contingency firms, 
                what to say when you reach out, when to follow up, and what different 
                responses actually mean.
              </p>
              <Link to="/dashboard/help">
                <Button variant="secondary" size="sm">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read the Complete Guide
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
