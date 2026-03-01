import { Download } from "lucide-react";
import { exportPageToPDF } from "../../lib/exportPDF";

type Props = {
  targetId: string;
  fileName: string;
};

export default function DownloadReportButton({
  targetId,
  fileName,
}: Props) {
  return (
    <div className="flex justify-center">
      <button
        onClick={() => exportPageToPDF(targetId, fileName)}
        className="
          no-print
          flex items-center gap-2
          px-6 py-3
          rounded-lg
          font-medium text-white
          bg-gradient-to-r from-red-600 to-rose-600
          hover:from-red-700 hover:to-rose-700
          shadow-md hover:shadow-lg
          transition-all duration-200
          active:scale-95
        "
      >
        <Download size={18} />
        Download Report
      </button>
    </div>
  );
}
