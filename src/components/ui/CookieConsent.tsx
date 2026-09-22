import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Button } from "~/components/ui/Button";

const COOKIE_CONSENT_KEY = "kairav-cookie-consent";

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a decision
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      setShowBanner(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setShowBanner(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
              By clicking "Accept", you consent to our use of cookies. Read our{" "}
              <Link to="/privacy" className="font-medium text-primary-600 hover:text-primary-700 underline">
                Privacy Policy
              </Link>{" "}
              and{" "}
              <Link to="/terms" className="font-medium text-primary-600 hover:text-primary-700 underline">
                Terms of Service
              </Link>{" "}
              for more information.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDecline}
              className="text-gray-600"
            >
              Decline
            </Button>
            <Button
              size="sm"
              onClick={handleAccept}
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
