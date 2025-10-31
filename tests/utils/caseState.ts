import { promises as fs } from 'fs';
import path from 'path';

export interface CaseData {
  box_attributeID: string;
  codeID: string;
  liveqr?: string | null;
  deceased_first?: string | null;
  deceased_last?: string | null;
}

const stateFile = path.resolve(__dirname, 'last-created-case.json');

export async function saveCaseData(data: CaseData): Promise<void> {
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(stateFile, payload, 'utf8');
}

export async function loadCaseData(): Promise<CaseData | null> {
  try {
    const raw = await fs.readFile(stateFile, 'utf8');
    const parsed = JSON.parse(raw) as CaseData;
    return parsed;
  } catch (err) {
    return null;
  }
}
