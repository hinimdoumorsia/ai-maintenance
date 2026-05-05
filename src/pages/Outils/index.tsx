// src/pages/Outils/index.tsx
import React from "react";
import AppLayout from "../../components/AppLayout";
import { Wrench } from "lucide-react";
import "./outils.css";

import DiagnosticCard  from "./components/DiagnosticCard";
import ExportCard      from "./components/ExportCard";
import SystemLogsCard  from "./components/SystemLogsCard";
import DataQualityCard from "./components/DataQualityCard";

// ─── Page ─────────────────────────────────────────────────────────────────────
const OutilsPage: React.FC = () => {
  return (
    <AppLayout
      title="Outils"
      subtitle="Diagnostic, export de données et surveillance qualité"
      icon={Wrench}
    >
      <div className="outils-main">
        <div className="outils-content">
          <DiagnosticCard />
          <ExportCard />
          <DataQualityCard />
          <div />
          <div style={{ gridColumn: "1 / -1" }}>
            <SystemLogsCard />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default OutilsPage;
