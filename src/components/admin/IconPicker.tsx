import { useState } from "react";
import * as LucideIcons from "lucide-react";
import { Search, X } from "lucide-react";

interface IconPickerProps {
  value: string;
  onChange: (iconName: string) => void;
  onClose: () => void;
}

// Curated list of commonly used icons
const COMMON_ICONS = [
  "CheckCircle", "Star", "Zap", "Heart", "Shield", "Award",
  "Target", "TrendingUp", "Users", "Globe", "Lock", "Unlock",
  "Mail", "Phone", "MapPin", "Calendar", "Clock", "Bell",
  "MessageSquare", "Send", "Share2", "Download", "Upload", "File",
  "Image", "Video", "Music", "Headphones", "Camera", "Film",
  "Settings", "Tool", "Wrench", "Package", "Box", "Archive",
  "Bookmark", "Tag", "Flag", "ThumbsUp", "ThumbsDown", "Smile",
  "Frown", "Meh", "AlertCircle", "AlertTriangle", "Info", "HelpCircle",
  "CheckSquare", "XSquare", "MinusSquare", "PlusSquare", "Circle", "Square",
  "ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown", "ChevronRight", "ChevronLeft",
  "Rocket", "Sparkles", "Code", "Terminal", "Database", "Server",
  "Cloud", "CloudOff", "Wifi", "WifiOff", "Battery", "BatteryCharging",
  "Sun", "Moon", "Eye", "EyeOff", "Search", "Filter"
];

export function IconPicker({ value, onChange, onClose }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredIcons = COMMON_ICONS.filter(iconName =>
    iconName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm fade-in">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl slide-in-bottom max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Choose an Icon</h3>
              <p className="text-sm text-gray-500 mt-1">Select from {COMMON_ICONS.length} popular icons</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search icons..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 focus:outline-none transition-all"
              autoFocus
            />
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {filteredIcons.map((iconName, index) => (
              <button
                key={iconName}
                onClick={() => {
                  onChange(iconName);
                  onClose();
                }}
                className={`
                  group relative aspect-square rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg fade-in
                  flex items-center justify-center
                  ${value === iconName 
                    ? 'border-primary-500 bg-primary-50 text-primary-700' 
                    : 'border-gray-200 hover:border-primary-300 text-gray-600 hover:text-primary-600'
                  }
                `}
                style={{ animationDelay: `${index * 10}ms` }}
                title={iconName}
              >
                {getIconComponent(iconName)}
                <div className="absolute inset-x-0 -bottom-6 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity text-center">
                  {iconName}
                </div>
              </button>
            ))}
          </div>
          
          {filteredIcons.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No icons found for "{searchTerm}"</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex-shrink-0 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-500 text-center">
            Currently selected: <span className="font-semibold text-gray-700">{value || "None"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
