// 시대(EraId) → 단계(StageId) 대응. 여러 단계가 같은 시대를 갖지 않는다는 전제는
// src/data/curriculum.ts 의 STAGES 정의에서 나온다.
import { STAGES } from "../../src/data/curriculum";
import type { EraId, StageId } from "../../src/lib/types";

export const STAGE_OF_ERA = new Map<EraId, StageId>();
for (const stage of STAGES) for (const eraId of stage.eraIds) STAGE_OF_ERA.set(eraId, stage.id);
