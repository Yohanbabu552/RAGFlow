/**
 * RecentDocuments — Recent documents list with status badges.
 */

import { Routes } from '@/routes';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';

interface RecentDoc {
  name: string;
  type: 'pdf' | 'img' | 'doc' | 'xls';
  category: string;
  time: string;
  status: 'processed' | 'processing' | 'failed';
}

const MOCK_DOCS: RecentDoc[] = [
  {
    name: 'Sona_Masoori_Rice_Brochure_2026.pdf',
    type: 'pdf',
    category: 'Rice Products',
    time: '2 hours ago',
    status: 'processed',
  },
  {
    name: 'Fair_And_Handsome_Label_v3.png',
    type: 'img',
    category: 'Personal Care',
    time: '4 hours ago',
    status: 'processed',
  },
  {
    name: 'Navratna_Oil_Product_Spec.docx',
    type: 'doc',
    category: 'Healthcare',
    time: '5 hours ago',
    status: 'processing',
  },
  {
    name: 'Q4_Product_Master_Data.xlsx',
    type: 'xls',
    category: 'Master Data',
    time: 'yesterday',
    status: 'processed',
  },
  {
    name: 'BoroPlus_Cream_Trade_Sheet.pdf',
    type: 'pdf',
    category: 'Skincare',
    time: 'yesterday',
    status: 'failed',
  },
];

const TYPE_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  pdf: { bg: 'bg-[#FFEBEE]', text: 'text-[#DC3545]', label: 'PDF' },
  img: { bg: 'bg-[#E8F5E9]', text: 'text-[#28A745]', label: 'IMG' },
  doc: { bg: 'bg-[#EBF5FF]', text: 'text-[#0078D4]', label: 'DOC' },
  xls: { bg: 'bg-[#E8F5E9]', text: 'text-[#2E7D32]', label: 'XLS' },
};

const STATUS_STYLES: Record<
  string,
  { className: string; label: string }
> = {
  processed: {
    className:
      'bg-[#E6F9ED] text-[#28A745] border border-[#A7F3D0]',
    label: '✓ Processed',
  },
  processing: {
    className:
      'bg-[#FFF8E1] text-[#F59E0B] border border-[#FDE68A]',
    label: '⟳ Processing',
  },
  failed: {
    className:
      'bg-[#FEF2F2] text-[#DC3545] border border-[#FECACA]',
    label: '✗ Failed',
  },
};

export function RecentDocuments() {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0]">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0]">
        <h3 className="text-sm font-semibold text-[#1A202C]">
          Recent Documents
        </h3>
        <button
          onClick={() => navigate(Routes.Datasets)}
          className="text-[13px] font-medium text-[#0078D4] hover:underline flex items-center gap-1"
        >
          View All <ArrowRight className="size-3.5" />
        </button>
      </div>

      <ul className="px-5 py-2">
        {MOCK_DOCS.map((doc, i) => {
          const typeStyle = TYPE_STYLES[doc.type];
          const statusStyle = STATUS_STYLES[doc.status];

          return (
            <li
              key={i}
              className="flex items-center gap-3.5 py-3 border-b border-[#F1F5F9] last:border-0"
            >
              {/* File type badge */}
              <div
                className={`w-[38px] h-[38px] rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${typeStyle.bg} ${typeStyle.text}`}
              >
                {typeStyle.label}
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#1A202C] truncate">
                  {doc.name}
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-0.5">
                  {doc.category} &bull; Uploaded {doc.time}
                </div>
              </div>

              {/* Status badge */}
              <span
                className={`text-[11px] font-medium px-2.5 py-1 rounded-full shrink-0 ${statusStyle.className}`}
              >
                {statusStyle.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
