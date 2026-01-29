import React from "react";
import { useTranslation } from "react-i18next";

interface OverviewTabProps {
  project: any;
  sizeUnits: { value: string; label: string }[];
  projectTypes: { value: string; label: string }[];
  durationUnits: { value: string; label: string }[];
}

function OverviewTab({
  project,
  sizeUnits,
  projectTypes,
  durationUnits,
}: OverviewTabProps) {
  const { t } = useTranslation(["project_overview", "durations", "common"]);

  const translatedType =
    projectTypes.find((pt) => pt.value === project.type)?.label || project.type;

  const sizeUnitLabel =
    sizeUnits.find((u) => u.value === project.size_unit)?.label ||
    project.size_unit;

  const durationUnitLabel =
    durationUnits.find((u) => u.value === project.duration_unit)?.label ||
    project.duration_unit
      ? t(`durations:${project.duration_unit.toLowerCase()}`)
      : t("common:notSpecified");

  return (
    <div className="bg-card rounded-lg shadow p-4 sm:p-6 text-sm">
      <h2 className="text-lg font-semibold mb-2">
        {t("project_overview:title")}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="font-bold">{t("project_overview:type")}</div>
          <div>{translatedType}</div>
        </div>

        <div>
          <div className="font-bold">{t("project_overview:size")}</div>
          <div>
            {project.size} {sizeUnitLabel}
          </div>
        </div>

        <div>
          <div className="font-bold">{t("project_overview:location")}</div>
          <div>{project.location || t("common:notSpecified")}</div>
        </div>

        <div>
          <div className="font-bold">{t("project_overview:duration")}</div>
          <div>
            {project.duration_days} {durationUnitLabel}
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="font-bold">
            {t("project_overview:clientRequirements")}
          </div>
          <div>{project.client_requirements || t("common:notSpecified")}</div>
        </div>

        <div className="md:col-span-2">
          <div className="font-bold">{t("project_overview:description")}</div>
          <div>{project.description || t("common:notSpecified")}</div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(OverviewTab);
