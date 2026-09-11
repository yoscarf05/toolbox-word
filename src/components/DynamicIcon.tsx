import React from 'react';
import {
  FileDown,
  Layers,
  FilePlus2,
  FileImage,
  Minimize2,
  Maximize2,
  Sparkles,
  FileText,
  GitCompare,
  QrCode,
  Wifi,
  KeyRound,
  Scale,
  Calendar,
  Code2,
  Binary,
  Link,
  FilePlus,
  Globe,
  Scissors,
  AlignLeft,
  Archive,
  CheckSquare,
  GraduationCap,
  Briefcase,
  Terminal,
  Wrench,
  Image as ImageIcon,
  CheckCircle2,
  BookOpen,
  FileType,
  FileCheck,
  BookMarked,
  Quote,
  FileCode,
  LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  FileDown,
  Layers,
  FilePlus2,
  FileImage,
  Minimize2,
  Maximize2,
  Sparkles,
  FileText,
  GitCompare,
  QrCode,
  Wifi,
  KeyRound,
  Scale,
  Calendar,
  Code2,
  Binary,
  Link,
  FilePlus,
  Globe,
  Scissors,
  AlignLeft,
  Archive,
  CheckSquare,
  GraduationCap,
  Briefcase,
  Terminal,
  Wrench,
  Image: ImageIcon,
  CheckCircle2,
  BookOpen,
  FileType,
  FileCheck,
  BookMarked,
  Quote,
  FileCode
};

interface DynamicIconProps {
  name: any;
  className?: string;
}

export const DynamicIcon: React.FC<DynamicIconProps> = ({ name, className = 'w-5 h-5' }) => {
  if (!name) {
    return <Wrench className={className} />;
  }

  // If it's already a component / function
  if (typeof name === 'function' || typeof name === 'object') {
    const Component = name;
    return <Component className={className} />;
  }

  // If it's a string name
  if (typeof name === 'string') {
    const Component = ICON_MAP[name] || Wrench;
    return <Component className={className} />;
  }

  return <Wrench className={className} />;
};
