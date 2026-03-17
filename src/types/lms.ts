export type BaseType = 'Solvent' | 'Water-Based';
export type Judgment = 'OK' | 'NG' | 'Pending';
export type SampleStatus = 'Pending' | 'In Progress' | 'Completed' | 'Approved';
export type Priority = 'Normal' | 'Urgent' | 'Critical';

export interface Sample {
  id: string;
  sampleId: string;
  productName: string;
  composition: string;
  color: string;
  fabricType: string;
  baseType: BaseType;
  batchNumber: string;
  supplierName: string;
  application: string;
  oemBrand: string;
  testDate: string;
  testConditions: string;
  status: SampleStatus;
  priority: Priority;
  requestedBy: string;
  testsTotal: number;
  testsCompleted: number;
  overallJudgment: Judgment;
}

export interface TestItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  directionRequired: boolean;
  multipleSamples: boolean;
  sampleCount: number;
  displayOrder: number;
}

export interface TestRequirement {
  testItemId: number;
  direction?: string;
  minValue?: number;
  maxValue?: number;
  requirementText?: string;
}

export interface TestResult {
  id: number;
  testItemId: number;
  direction?: string;
  samples: (number | null)[];
  average: number | null;
  judgment: Judgment;
  testedBy: string;
  comments: string;
}

export interface TestRowData {
  testItem: TestItem;
  requirement: TestRequirement;
  results: TestResult[];
}
