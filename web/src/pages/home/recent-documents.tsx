/**
 * RecentDocuments — Recent documents list with status badges.
 * Connected to /api/v1/admin/stats/documents (getDocumentStats).
 */

import { Routes } from '@/routes';
import { getDocumentStats } from '@/services/admin-service';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

interface RecentDoc {
  id: string;
  name: string;
  type: string;
  category: string;
  time_ago: string;
  status: string;
}

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
    className: 'bg-[#E6F9ED] text-[#28A745] border border-[#A7F3D0]',
    label: '\u2713 Processed',
  },
  processing: {
    className: 'bg-[#FFF8E1] text-[#F59E0B] border border-[#FDE68A]',
    label: '\u27F3 Processing',
  },
  failed: {
    className: 'bg-[#FEF2F2] text-[#DC3545] border border-[#FECACA]',
    label: '\u2717 Failed',
  },
};

export function RecentDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<RecentDoc[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await getDocumentStats();
      const data = res?.data;
      if (data?.code === 0 && data.data?.recent_documents) {
        setDocuments(
          data.data.recent_documents.map((d) => ({
            id: d.id,
            name: d.name,
            type: d.type,
            category: d.category,
            time_ago: d.time_ago,
            status: d.status,
          })),
        );
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

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

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="size-5 text-[#0078D4] animate-spin" />
          <span className="ml-2 text-sm text-[#64748B]">Loading...</span>
        </div>
      ) : documents.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-[#64748B]">
          No documents uploaded yet.
        </div>
      ) : (
        <ul className="px-5 py-2">
          {documents.map((doc) => {
            const typeStyle = TYPE_STYLES[doc.type] || TYPE_STYLES.pdf;
            const statusStyle =
              STATUS_STYLES[doc.status] || STATUS_STYLES.processed;

            return (
              <li
                key={doc.id}
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
                    {doc.category} &bull; Uploaded {doc.time_ago}
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
      )}
    </div>
  );
}
