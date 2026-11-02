import { Suspense } from "react";
import { Chargement } from "@/components/coque";
import { LecteurChapitre } from "./lecteur";

export default function PageChapitre() {
  return (
    <Suspense fallback={<Chargement />}>
      <LecteurChapitre />
    </Suspense>
  );
}
