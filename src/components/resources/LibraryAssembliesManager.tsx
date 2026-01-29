"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AssemblyDetail, AssemblyList } from "@/components/assemblies";

export default function LibraryAssembliesManager() {
  const { t } = useTranslation(["resources", "common"]);
  const [selectedAssemblyId, setSelectedAssemblyId] = useState<string | null>(
    null,
  );

  if (selectedAssemblyId) {
    return (
      <AssemblyDetail
        assemblyId={selectedAssemblyId}
        onBack={() => setSelectedAssemblyId(null)}
      />
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">
          {t("resources:assemblies.title")}
        </h2>
      </div>
      <AssemblyList onSelectAssembly={setSelectedAssemblyId} />
    </div>
  );
}
