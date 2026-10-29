import { Suspense } from "react";
import { Chargement } from "@/components/coque";
import { ExerciceCoeur } from "./exercice-coeur";

export default function PageExercice() {
  return (
    <Suspense fallback={<Chargement />}>
      <ExerciceCoeur />
    </Suspense>
  );
}
