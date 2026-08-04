// Fonte ÚNICA em @sintera/core (paridade Web↔Mobile). Reexporta para preservar os import sites
// existentes ('@/lib/exams/careFlow'). A regra vive uma vez só, no core.
export {
  type CareStage, CARE_STAGES, stageIndex, nextStage, resolveCareStage, stageReached, careStageFor,
} from '@sintera/core'
